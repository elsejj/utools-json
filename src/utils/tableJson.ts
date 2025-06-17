
type Shape = {
  rows: number
  cols: number
}

type Table = {
  headers: string[]
  cells: any[][]
}

/**
 * calculate the columns and rows of the JSON object
 * columns is the number of JSON fields count, including nested objects expanded
 * rows is the max length of the nested Arrays
 * @param obj any JSON object
 * @returns a Shape object representing the rows and columns
 */
export function json2DShape(obj: object): Shape {
  if (Array.isArray(obj)) {
    let cols = 0
    let rows = obj.length
    for (const item of obj) {
      const s = json2DShape(item)
      rows = Math.max(rows, s.rows)
      cols = Math.max(cols, s.cols)
    }
    return { rows, cols }
  } else if (typeof obj === 'object' && obj !== null) {
    let entries = Object.entries(obj)
    let rows = 1
    let cols = entries.length
    for (const [_key, value] of entries) {
      const s = json2DShape(value)
      if (s.cols > 0) {
        cols += s.cols - 1
      }
      rows = Math.max(rows, s.rows)
    }
    return { rows, cols }
  } else {
    return { rows: 0, cols: 0 }
  }
}

/**
 * convert a JSON object to a 2D Table
 */
export function jsonToTable(obj: object): Table {
  const shape = json2DShape(obj);
  const cells = Array.from({ length: shape.rows }, () => Array(shape.cols).fill(null));
  const headers: string[] = [];

  const parentNode = ''

  fillCells(cells, headers, true, obj, 0, 0, parentNode);

  return { headers, cells };
}

function isPrimitive(value: any): boolean {
  if (value === null) return true;
  if (Array.isArray(value)) {
    if (value.length === 0) return true;
    return isPrimitive(value[0]); // Check the first element of the array
  }
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return typeof value !== 'object' && typeof value !== 'function'
}

function fillCells(cells: any[][], headers: string[], changeHeader: boolean, obj: any, row: number, col: number, parentNode: string) {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => {
      fillCells(cells, headers, i === 0, v, row + i, col, parentNode);
    });
  } else if (typeof obj === 'object' && obj !== null) {
    let i = 0;
    for (const [key, value] of Object.entries(obj)) {
      const newHeader = parentNode ? `${parentNode}.${key}` : key;
      if (changeHeader && isPrimitive(value) && row === 0) {
        headers.push(newHeader);
      }
      fillCells(cells, headers, true, value, row, col + i, newHeader);
      if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
          i += Object.keys(first).length;
        } else {
          i += 1
        }
      } else if (typeof value === 'object' && value !== null) {
        i += Object.keys(value).length;
      } else {
        i++
      }
    }
  } else {
    cells[row][col] = obj
  }
}

export function plainHeadersToNested(headers: string[]): string[][] {
  const splitted = headers.map(header => header.split('.'));
  let depth = splitted.reduce((max, arr) => Math.max(max, arr.length), 0);
  const nestedHeaders: string[][] = Array.from({ length: depth }, () => []);
  for (const parts of splitted) {
    for (let i = 0; i < depth; i++) {
      if (i < parts.length) {
        nestedHeaders[i].push(parts[i]);
      } else {
        nestedHeaders[i].push('');
      }
    }
  }
  return nestedHeaders;
}

export function printTable(table: Table): string {
  const headerRow = table.headers.join('|');
  const cellRows = table.cells.map(row => row.map(cell => cell === null ? '' : cell).join('|')).join('\n');
  return `${headerRow}\n${cellRows}`;
}