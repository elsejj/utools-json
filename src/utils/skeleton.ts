
/**
 * 
 * create a skeleton of the object
 * 
 * if the object is an array, create a skeleton of the first element
 * if the object is an object, each key will be the skeleton of the value
 * if the object is a string, number, boolean, null, undefined, return empty value of the type
 * 
 * @param obj 
 */
export function skeleton(obj: any) : any{
    if (obj === null) return null;
    if (obj === undefined) return undefined;

    if (Array.isArray(obj)) {
        return obj.length > 0 ? [skeleton(obj[0])] : [];
    }

    const type = typeof obj;
    if (type === 'string') return "";
    if (type === 'number') return 0;
    if (type === 'boolean') return false;

    if (type === 'object') {
        const result: any = {};
        Object.keys(obj).forEach(key => {
            result[key] = skeleton(obj[key]);
        });
        return result;
    }

    return undefined;
}