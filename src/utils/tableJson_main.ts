
import { htmlNestedFromJson } from "./fromJson";
import { json2DShape, jsonToTable, printTable } from "./tableJson";



function main() {
  const obj =
    [
      { name: "John", age: 30, city: "New York", scores: { math: 90, science: 85 } },
      { name: "Jane", age: 25, city: "Los Angeles", scores: { math: 88, science: 92 } },
      { name: "Doe", age: 22, city: "Chicago", scores: { math: 95, science: 89 } }
    ]
  const table = jsonToTable(obj);
  console.log(json2DShape(obj));
  console.log(printTable(table));


  console.log(htmlNestedFromJson(JSON.stringify(obj, null, 2)));
}

main();