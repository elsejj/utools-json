//@ts-ignore
import JSON5 from 'json5'
import * as YAML from 'yaml';
import { jsonToTable, plainHeadersToNested } from './tableJson';

export function oneLineFromJson(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText);
  return JSON.stringify(jsonObject);
}

export function quotedOneLineFromJson(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText);
  return JSON.stringify(JSON.stringify(jsonObject));
}

export function quotedMultiLineFromJson(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText);
  return JSON.stringify(JSON.stringify(jsonObject, null, 2));
}

export function base64FromJson(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText);
  const jsonString = JSON.stringify(jsonObject);
  return btoa(jsonString);
}

export function javaScriptFromJson(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText);
  return JSON5.stringify(jsonObject, null, 2)
}

export function jsonFromJson(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText);
  return JSON.stringify(jsonObject, null, 2);
}

export function yamlFromJson(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText);
  return YAML.stringify(jsonObject, null, 2);
}


const HTML_PREFIX = `
<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">

<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=ProgId content=Excel.Sheet>
<meta name=Generator content="Microsoft Excel 15">
<style>
<!--table
.xl64
	{mso-number-format:"\@";
	white-space:normal;}
.xl65
	{mso-number-format:"0_ ";
	white-space:normal;}
-->
</style>
</head>
<body>
`
const HTML_SUFFIX = `
</body>
</html>
`

export function htmlPlainFromJson(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText);
  const table = jsonToTable(jsonObject);
  const lines = [
    HTML_PREFIX,
    '<table class="json_table_v000">',
  ]
  lines.push('<tr>');
  table.headers.forEach(header => {
    lines.push(`<th>${header}</th>`)
  })
  lines.push('</tr>')

  for (let row = 0; row < table.cells.length; row++) {
    lines.push('<tr>');
    for (let col = 0; col < table.cells[row].length; col++) {
      const cell = table.cells[row][col];
      if (cell === null) {
        continue
      }
      let cellClass = ''
      if (typeof cell === 'number') {
        if (Number.isInteger(cell)) {
          const text = cell.toString();
          if (text.length > 10) {
            cellClass = 'xl65';
          }
        }
      } else if (typeof cell === 'string') {
        // Check if the string is a integer
        if (cell.length > 10 && /^\d+$/.test(cell)) {
          cellClass = 'xl64';
        }
      }

      let rowSpan = 1;
      while (row + rowSpan < table.cells.length && table.cells[row + rowSpan][col] === null) {
        rowSpan++;
      }
      if (rowSpan > 1) {
        lines.push(`<td rowspan="${rowSpan}" class="${cellClass}">${cell}</td>`);
      } else {
        lines.push(`<td class="${cellClass}">${cell}</td>`);
      }
    }
    lines.push('</tr>');
  }

  lines.push('</table>');
  lines.push(HTML_SUFFIX);
  return lines.join('\n');
}

export function htmlNestedFromJson(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText);
  const table = jsonToTable(jsonObject);

  const lines = [
    HTML_PREFIX,
    '<table class="json_table_v000">',
  ]
  const nestedHeaders = plainHeadersToNested(table.headers);
  for (let row = 0; row < nestedHeaders.length; row++) {
    lines.push('<tr>');
    const headers = nestedHeaders[row];

    for (let col = 0; col < nestedHeaders[row].length;) {

      let rowSpan = 1;
      while (row + rowSpan < nestedHeaders.length && nestedHeaders[row + rowSpan][col] === '') {
        rowSpan++;
      }

      let colSpan = 1
      let lastNotSame = headers.findIndex((header, i) => i > col && header !== headers[col]);
      if (lastNotSame === -1) {
        lastNotSame = headers.length;
      }
      if (lastNotSame > col + 1) {
        colSpan = lastNotSame - col;
      }

      const colSpanText = colSpan > 1 ? ` colspan="${colSpan}"` : '';
      const rowSpanText = rowSpan > 1 ? ` rowspan="${rowSpan}"` : '';

      if (headers[col].length > 0) {
        lines.push(`<th${colSpanText}${rowSpanText}>${headers[col]}</th>`);
      }
      col += colSpan;
    }
    lines.push('</tr>');
  }

  for (let row = 0; row < table.cells.length; row++) {
    lines.push('<tr>');
    for (let col = 0; col < table.cells[row].length; col++) {
      const cell = table.cells[row][col];
      if (cell === null) {
        continue
      }
      let cellClass = ''
      if (typeof cell === 'number') {
        if (Number.isInteger(cell)) {
          const text = cell.toString();
          if (text.length > 10) {
            cellClass = 'xl65';
          }
        }
      } else if (typeof cell === 'string') {
        // Check if the string is a integer
        if (cell.length > 10 && /^\d+$/.test(cell)) {
          cellClass = 'xl64';
        }
      }
      let rowSpan = 1;
      while (row + rowSpan < table.cells.length && table.cells[row + rowSpan][col] === null) {
        rowSpan++;
      }
      if (rowSpan > 1) {
        lines.push(`<td rowspan="${rowSpan}" class="${cellClass}">${cell}</td>`);
      } else {
        lines.push(`<td class="${cellClass}">${cell}</td>`);
      }
    }
    lines.push('</tr>');
  }

  lines.push('</table>');
  lines.push(HTML_SUFFIX);
  return lines.join('\n');
}