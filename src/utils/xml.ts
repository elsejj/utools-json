
/**
 * parse XML to object
 * 
 * when root element is xml, return it's children
 * when root element is not xml, return it's content
 * 
 * for each xml element 
 *  - if it has attributes, it will be a object with same attributes and a '#value' attribute for it's content or children
 *  - if it not has attributes, the object is just it's content or children
 *  - when it only contains text, the object is just it's text content
 * 
 * @param xml : xml string
 * @returns parsed object
 */
export function parseXML(xml: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const root = doc.documentElement;
    
    if (root.querySelector('parsererror')) {
      throw new Error('Invalid XML');
    }

    // when root element is xml, return it's children
    if (root.tagName === 'xml') {
        return parseChildren(root);
    }
    // when root element is not xml, return it's content
    return {
      [root.tagName]: parseElement(root)
    };
}

function parseElement(el: Element): any {
    const children = parseChildren(el);
    if (!el.hasAttributes()) {
        return children;
    }
    const result: any = {};
    for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        result[attr.name] = attr.value;
    }
    result['#value'] = children;
    return result;
}

function parseChildren(el: Element): any {
    // Check if it has element children
    let hasElementChild = false;
    for (let i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 1) {
            hasElementChild = true;
            break;
        }
    }

    if (!hasElementChild) {
        return el.textContent || "";
    }

    const result: any = {};
    for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (node.nodeType === 1) { // Element
            const childEl = node as Element;
            const key = childEl.tagName;
            const value = parseElement(childEl);
            if (Object.prototype.hasOwnProperty.call(result, key)) {
                if (!Array.isArray(result[key])) {
                    result[key] = [result[key]];
                }
                result[key].push(value);
            } else {
                result[key] = value;
            }
        }
    }
    return result;
}


export function xmlFromJson(text: string): string {
  const json = JSON.parse(text);
  return renderElement("xml", json, 0);
}



function indentText(indent:number): string {
  return '  '.repeat(indent);
}



function renderElement(tagName: string, content: any, indent:number): string {
  if (content === null || content === undefined) {
    return `${indentText(indent)}<${tagName} />`;
  }
  if (Array.isArray(content)) {
    return content.map(item => renderElement(tagName, item, indent + 1)).join('');
  }
  if (typeof content !== 'object') {
    return `${indentText(indent)}<${tagName}>${wrapCdata(String(content))}</${tagName}>`;
  }

  const lines = [];
  for (const key in content) {
    lines.push(renderElement(key, content[key], indent + 1));
  }
  return `${indentText(indent)}<${tagName}>
${lines.join('\n')}
${indentText(indent)}</${tagName}>`;
}



const INVALID_CONTENT_CHARS = ['<', '>', '&', ']', '['];
function wrapCdata(content: string): string {
  if (INVALID_CONTENT_CHARS.some(char => content.includes(char))) {
    return `<![CDATA[${content}]]>`;
  }
  return content;
}