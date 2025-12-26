import * as YAML from "yaml";
//@ts-ignore
import JSON5 from "json5";
import TOML from "smol-toml";
import { parseXML } from "./xml";

export interface toJSON {
  toJSON: (data: any) => string;
  supported: (data: any) => boolean;
}

function reOrderKeys(key: string, obj: any): any {
  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    const orderedObj: any = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      orderedObj[key] = obj[key];
    }
    return orderedObj;
  }
  return obj;
}

/**
 * Converts a JSON string to a pretty-printed JSON string
 * @param jsonText The JSON string to format
 * @returns A pretty-printed JSON string
 * @throws Will throw an error if the input is not a valid JSON string
 */
function jsonPretty(jsonText: string, sortKey: boolean = true): string {
  const parsers = [JSON.parse, JSON5.parse, parseXML, TOML.parse, YAML.parse];
  for (const parser of parsers) {
    try {
      //@ts-ignore
      const jsonObject = parser(jsonText);
      const replacer = sortKey ? reOrderKeys : undefined;
      return JSON.stringify(jsonObject, replacer, 2);
    } catch {
      // continue to the next parser
    }
  }
  return jsonText;
}

export class StringToJSON implements toJSON {
  private _sortKey: boolean;

  constructor(sortKey: boolean) {
    this._sortKey = sortKey;
  }

  toJSON(data: any): string {
    if (typeof data !== "string") {
      throw new Error("Input must be a string");
    }
    const stringSigns = ['"', "'", "`"];
    const jsonSigns = ["{", "[", ":", "\n", '"'];
    const isQuoted = stringSigns.some(
      (sign) => data.startsWith(sign) && data.endsWith(sign)
    );
    if (isQuoted) {
      // convert to a valid JSON string
      data = JSON5.parse(data);
    } else if (
      data.length > 20 &&
      !jsonSigns.some((sign) => data.includes(sign))
    ) {
      // maybe a base64 string, try to decode it
      try {
        data = atob(data);
      } catch {
        // maybe not a known format, return as is
        return data;
      }
      return this.toJSON(data);
    }
    return jsonPretty(data, this._sortKey);
  }

  supported(data: any): boolean {
    return typeof data === "string";
  }
}
