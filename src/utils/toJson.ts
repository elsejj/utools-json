import JSON5 from 'json5'


export interface toJSON {
  toJSON: (data: any) => string
  supported: (data: any) => boolean
}


/**
 * Converts a JSON string to a pretty-printed JSON string
 * @param jsonText The JSON string to format
 * @returns A pretty-printed JSON string
 * @throws Will throw an error if the input is not a valid JSON string
 */
function jsonPretty(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText)
  return JSON.stringify(jsonObject, null, 2)
}

export class StringToJSON implements toJSON {
  toJSON(data: any): string {
    if (typeof data !== 'string') {
      throw new Error('Input must be a string')
    }
    const stringSigns = ['"', "'", '`'];
    const jsonSings = ['{', '['];
    const isQuoted = stringSigns.some(sign => data.startsWith(sign) && data.endsWith(sign))
    if (isQuoted) {
      // convert to a valid JSON string
      data = '"' + data.slice(1, -1) + '"'
      data = JSON.parse(data)
    } else if (!jsonSings.some(sign => data.includes(sign))) {
      // maybe a base64 string, try to decode it
      try {
        data = atob(data)
      } catch {
        // maybe not a known format, return as is
        return data
      }
      return this.toJSON(data)
    }
    return jsonPretty(data)
  }

  supported(data: any): boolean {
    return typeof data === 'string'
  }
}
