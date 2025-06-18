import JSON5 from 'json5'
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

export function htmlPlainFromJson(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText);
  const table = jsonToTable(jsonObject);
  const lines = [
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
      let rowSpan = 1;
      while (row + rowSpan < table.cells.length && table.cells[row + rowSpan][col] === null) {
        rowSpan++;
      }
      if (rowSpan > 1) {
        lines.push(`<td rowspan="${rowSpan}">${cell}</td>`);
      } else {
        lines.push(`<td>${cell}</td>`);
      }
    }
    lines.push('</tr>');
  }

  lines.push('</table>');
  return lines.join('\n');
}

export function htmlNestedFromJson(jsonText: string): string {
  const jsonObject = JSON5.parse(jsonText);
  const table = jsonToTable(jsonObject);

  const lines = [
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
      let rowSpan = 1;
      while (row + rowSpan < table.cells.length && table.cells[row + rowSpan][col] === null) {
        rowSpan++;
      }
      if (rowSpan > 1) {
        lines.push(`<td rowspan="${rowSpan}">${cell}</td>`);
      } else {
        lines.push(`<td>${cell}</td>`);
      }
    }
    lines.push('</tr>');
  }

  lines.push('</table>');
  return lines.join('\n');
}