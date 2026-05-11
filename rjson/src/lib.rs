mod utils;

use base64::Engine;
use saphyr::LoadableYamlNode;
use serde_json::Value;
use wasm_bindgen::prelude::*;

fn scalar_to_json(scalar: &saphyr::Scalar) -> serde_json::Value {
  match scalar {
    saphyr::Scalar::Null => serde_json::Value::Null,
    saphyr::Scalar::Boolean(b) => serde_json::Value::Bool(*b),
    saphyr::Scalar::Integer(i) => serde_json::Value::Number((*i).into()),
    saphyr::Scalar::FloatingPoint(f) => serde_json::Number::from_f64(f.0)
      .map(serde_json::Value::Number)
      .unwrap_or(serde_json::Value::Null),
    saphyr::Scalar::String(s) => serde_json::Value::String(s.to_string()),
  }
}

fn yaml_to_json(yaml: &saphyr::Yaml) -> serde_json::Value {
  match yaml {
    saphyr::Yaml::Value(scalar) => scalar_to_json(scalar),
    saphyr::Yaml::Sequence(seq) => serde_json::Value::Array(seq.iter().map(yaml_to_json).collect()),
    saphyr::Yaml::Mapping(map) => {
      let mut res = serde_json::Map::new();
      for (k, v) in map {
        let key = match k {
          saphyr::Yaml::Value(saphyr::Scalar::String(s)) => s.to_string(),
          saphyr::Yaml::Representation(s, _, _) => s.to_string(),
          saphyr::Yaml::Value(s) => format!("{:?}", s),
          _ => format!("{:?}", k),
        };
        res.insert(key, yaml_to_json(v));
      }
      serde_json::Value::Object(res)
    }
    saphyr::Yaml::Representation(s, style, tag) => {
      if let Some(scalar) =
        saphyr::Scalar::parse_from_cow_and_metadata(s.clone(), *style, tag.as_ref())
      {
        scalar_to_json(&scalar)
      } else {
        serde_json::Value::String(s.to_string())
      }
    }
    saphyr::Yaml::Tagged(_, node) => yaml_to_json(node),
    saphyr::Yaml::Alias(_) | saphyr::Yaml::BadValue => serde_json::Value::Null,
  }
}

fn csv_to_json(text: &str) -> Result<serde_json::Value, csv::Error> {
  if text
    .trim()
    .starts_with(|c| c == '{' || c == '"' || c == '[')
  {
    return Err(csv::Error::from(std::io::Error::new(
      std::io::ErrorKind::InvalidData,
      "Input looks like JSON, not CSV",
    )));
  }

  let (tab, comma, semicolon) = text.lines().take(5).fold((0, 0, 0), |mut acc, line| {
    for c in line.bytes() {
      match c {
        b'\t' => acc.0 += 1,
        b',' => acc.1 += 1,
        b';' => acc.2 += 1,
        _ => {}
      }
    }
    acc
  });

  if tab < 1 && comma < 1 && semicolon < 1 {
    return Err(csv::Error::from(std::io::Error::new(
      std::io::ErrorKind::InvalidData,
      "No delimiter found",
    )));
  }

  let delimiter = if tab > comma && tab > semicolon {
    b'\t'
  } else if comma > semicolon {
    b','
  } else {
    b';'
  };
  let mut rdr = csv::ReaderBuilder::new()
    .delimiter(delimiter)
    .flexible(true)
    .from_reader(text.as_bytes());

  let headers = rdr.headers()?.clone();

  let mut value = vec![];

  for r in rdr.records() {
    match r {
      Ok(record) => {
        let mut map = serde_json::Map::new();
        for (header, field) in headers.iter().zip(record.iter()) {
          map.insert(header.to_string(), parse_text_value(field));
        }
        value.push(serde_json::Value::Object(map));
      }
      Err(err) => {
        return Err(err);
      }
    }
  }

  if value.is_empty() {
    return Err(csv::Error::from(std::io::Error::new(
      std::io::ErrorKind::InvalidData,
      "No records found",
    )));
  }

  Ok(Value::Array(value))
}

fn sort_keys(value: &mut serde_json::Value) {
  match value {
    serde_json::Value::Object(map) => {
      map.sort_keys();
      map.values_mut().for_each(|v| sort_keys(v));
    }
    _ => {}
  }
}

fn stringify(value: &mut serde_json::Value, preserve_order: bool) -> String {
  if preserve_order {
    serde_json::to_string_pretty(value).unwrap_or_else(|_| value.to_string())
  } else {
    sort_keys(value);
    serde_json::to_string_pretty(value).unwrap_or_else(|_| value.to_string())
  }
}

fn parse_text_value(s: &str) -> Value {
  let s = s.trim();
  if let Ok(i64_val) = s.parse::<i64>() {
    return serde_json::Value::Number(i64_val.into());
  } else if let Ok(f64_val) = s.parse::<f64>() {
    if let Some(num) = serde_json::Number::from_f64(f64_val) {
      return serde_json::Value::Number(num);
    }
  }
  serde_json::Value::String(s.to_string())
}

fn normalize_xml(value: &Value) -> Value {
  match value {
    serde_json::Value::Object(ref map) => {
      if map.len() == 1 {
        match map.get("$text") {
          Some(val) => {
            return normalize_xml(val);
          }
          None => {
            let mut res = serde_json::Map::new();
            for (k, v) in map {
              res.insert(k.clone(), normalize_xml(v));
            }
            return serde_json::Value::Object(res);
          }
        }
      } else {
        let mut res = serde_json::Map::new();
        for (k, v) in map {
          res.insert(k.clone(), normalize_xml(v));
        }
        return serde_json::Value::Object(res);
      }
    }
    serde_json::Value::Array(arr) => {
      let mut res = Vec::new();
      for v in arr {
        res.push(normalize_xml(v));
      }
      return serde_json::Value::Array(res);
    }
    serde_json::Value::String(s) => parse_text_value(s),
    _ => value.clone(),
  }
}

/// parse input of any supported format, return pretty json string or None if parsing fails.
///
/// Supported format:
///
///   - json
///   - json5
///   - yaml : by  https://github.com/saphyr-rs/saphyr
///   - toml: by https://github.com/toml-rs/toml
///   - xml: by https://github.com/tafia/quick-xml
///   - quoted string: " or ' surrounded string, which will be dequoted then retry format
///   - base64 string: will be decoded then retry format, by https://github.com/marshallpierce/rust-base64
///
///
fn try_format(data: &str, preserve_order: bool) -> Option<String> {
  let data = data.trim();
  if data.is_empty() {
    return None;
  }

  // try json
  if let Ok(mut value) = serde_json::from_str::<serde_json::Value>(data) {
    match value {
      serde_json::Value::String(s) => {
        if let Some(formatted) = try_format(&s, preserve_order) {
          return Some(formatted);
        }
      }
      _ => return Some(stringify(&mut value, preserve_order)),
    }
  }

  // try json5
  if let Ok(mut value) = json5::from_str::<serde_json::Value>(data) {
    match value {
      serde_json::Value::String(s) => {
        if let Some(formatted) = try_format(&s, preserve_order) {
          return Some(formatted);
        }
      }
      _ => return Some(stringify(&mut value, preserve_order)),
    }
  }

  // try toml
  if let Ok(mut value) = toml::from_str::<serde_json::Value>(data) {
    match value {
      serde_json::Value::String(s) => {
        if s != data {
          if let Some(formatted) = try_format(&s, preserve_order) {
            return Some(formatted);
          }
        }
      }
      _ => return Some(stringify(&mut value, preserve_order)),
    }
  }

  // try xml
  if let Ok(value) = quick_xml::de::from_str::<serde_json::Value>(data) {
    match value {
      serde_json::Value::String(s) => {
        if s != data {
          if let Some(formatted) = try_format(&s, preserve_order) {
            return Some(formatted);
          }
        }
      }
      _ => {
        let mut normalized = normalize_xml(&value);
        return Some(stringify(&mut normalized, preserve_order));
      }
    }
  }

  // try csv
  if let Ok(mut value) = csv_to_json(data) {
    return Some(stringify(&mut value, preserve_order));
  }

  // try base64
  if let Ok(decoded) = base64::engine::general_purpose::STANDARD.decode(data) {
    if let Ok(s) = String::from_utf8(decoded) {
      if s != data {
        if let Some(formatted) = try_format(&s, preserve_order) {
          return Some(formatted);
        }
      }
    }
  }

  // try yaml
  if let Ok(docs) = saphyr::Yaml::load_from_str(data) {
    if !docs.is_empty() {
      let mut value = yaml_to_json(&docs[0]);
      match value {
        serde_json::Value::String(s) => {
          if s != data {
            if let Some(formatted) = try_format(&s, preserve_order) {
              return Some(formatted);
            }
          }
        }
        _ => return Some(stringify(&mut value, preserve_order)),
      }
    }
  }

  None
}

#[wasm_bindgen]
pub fn format(data: &str, preserve_order: bool) -> Result<String, String> {
  match try_format(data, preserve_order) {
    Some(s) => Ok(s),
    None => Err("Invalid json5".to_string()),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_format() {
    let data = "{\"foo\": \"bar\"}";
    assert_eq!(
      format(data, false),
      Ok("{\n  \"foo\": \"bar\"\n}".to_string())
    );
  }

  #[test]
  fn test_format_json5() {
    let data = "{foo: \"bar\"}";
    assert_eq!(
      format(data, false),
      Ok("{\n  \"foo\": \"bar\"\n}".to_string())
    );
  }

  #[test]
  fn test_format_with_comment() {
    let data = "{
    // comment
    foo: \"bar\"
  }";
    assert_eq!(
      format(data, false),
      Ok("{\n  \"foo\": \"bar\"\n}".to_string())
    );
  }

  #[test]
  fn test_format_bigint() {
    let data = "{foo: 9223372036854775807}";
    assert_eq!(
      format(data, false),
      Ok("{\n  \"foo\": 9223372036854775807\n}".to_string())
    );
  }

  #[test]
  fn test_format_json_in_string() {
    let data = r#""{\"foo\":\"bar\"}""#;
    assert_eq!(
      format(data, false),
      Ok("{\n  \"foo\": \"bar\"\n}".to_string())
    );

    let data = r#"'{\"foo\":\"bar\"}'"#;
    assert_eq!(
      format(data, false),
      Ok("{\n  \"foo\": \"bar\"\n}".to_string())
    );
  }

  #[test]
  fn test_format_yaml() {
    let data = "foo: bar\nbaz: 1";
    // serde_json Map sorts keys alphabetically: baz, foo
    assert_eq!(
      format(data, false),
      Ok("{\n  \"baz\": 1,\n  \"foo\": \"bar\"\n}".to_string())
    );
  }

  #[test]
  fn test_format_toml() {
    let data = "foo = \"bar\"\nbaz = 1";
    assert_eq!(
      format(data, false),
      Ok("{\n  \"baz\": 1,\n  \"foo\": \"bar\"\n}".to_string())
    );
  }

  #[test]
  fn test_format_xml() {
    let data = "<root><foo>bar</foo><baz>1</baz></root>";
    // quick-xml parsing into Value might vary, but let's check it's Ok
    assert_eq!(
      format(data, false),
      Ok("{\n  \"baz\": 1,\n  \"foo\": \"bar\"\n}".to_string())
    );

    let data = r#"<root><element attribute="value">text</element></root>"#;
    assert_eq!(
      format(data, false),
      Ok(
        "{\n  \"element\": {\n    \"$text\": \"text\",\n    \"@attribute\": \"value\"\n  }\n}"
          .to_string()
      )
    );

    let data = r#"<xml>
  <ToUserName><![CDATA[toUser]]></ToUserName>
  <FromUserName><![CDATA[fromUser]]></FromUserName>
  <CreateTime>1348831860</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[this is a test]]></Content>
  <MsgId>1234567890123456</MsgId>
</xml>"#;

    assert_eq!(
      format(data, false),
      Ok(
        "{
  \"Content\": \"this is a test\",
  \"CreateTime\": 1348831860,
  \"FromUserName\": \"fromUser\",
  \"MsgId\": 1234567890123456,
  \"MsgType\": \"text\",
  \"ToUserName\": \"toUser\"
}"
        .to_string()
      )
    );
  }

  #[test]
  fn test_format_csv() {
    let data = "\
city,country,pop
Boston,United States,4628910
";
    assert_eq!(
      format(data, false),
      Ok(
        r#"[
  {
    "city": "Boston",
    "country": "United States",
    "pop": 4628910
  }
]"#
          .to_string()
      )
    );
  }

  #[test]
  fn test_format_base64() {
    let data = "eyJmb28iOiAiYmFyIn0="; // {"foo": "bar"}
    assert_eq!(
      format(data, false),
      Ok("{\n  \"foo\": \"bar\"\n}".to_string())
    );
  }

  #[test]
  fn test_format_nested_base64_json() {
    let data = "\"eyJmb28iOiAiYmFyIn0=\""; // "{"foo": "bar"}" in base64, quoted
    assert_eq!(
      format(data, false),
      Ok("{\n  \"foo\": \"bar\"\n}".to_string())
    );
  }

  #[test]
  fn test_preserve_order() {
    let data = "{\"b\": 1, \"a\": 2}";
    assert_eq!(
      format(data, false),
      Ok("{\n  \"a\": 2,\n  \"b\": 1\n}".to_string())
    );
    assert_eq!(
      format(data, true),
      Ok("{\n  \"b\": 1,\n  \"a\": 2\n}".to_string())
    );
  }
}
