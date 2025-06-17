import { expect, test } from "bun:test";

import { json2DShape, jsonToTable, printTable } from "./tableJson";



test("simple", () => {
  const obj = {
    name: "John",
    age: 30,
    city: "New York",
    job: {
      title: "Developer",
      company: "Tech Co"
    }
  }
  const table = jsonToTable(obj);
  console.log(json2DShape(obj));
  console.log(printTable(table));
  expect(table).toEqual({
    headers: ["name", "age", "city", "job.title", "job.company"],
    cells: [["John", 30, "New York", "Developer", "Tech Co"]],
  });
});


test("array_field", () => {
  const obj = {
    name: "John",
    age: 30,
    hobbies: ["reading", "gaming", "coding"],
    job: {
      title: "Developer",
      company: "Tech Co"
    }
  }
  const table = jsonToTable(obj);
  console.log(json2DShape(obj));
  console.log(printTable(table));
  expect(table).toEqual({
    headers: ["name", "age", "hobbies", "job.title", "job.company"],
    cells: [
      ["John", 30, "reading", "Developer", "Tech Co"],
      [null, null, "gaming", null, null],
      [null, null, "coding", null, null]
    ],
  });
})


test("array_fields", () => {
  const obj = {
    users: [
      { name: "John", age: 30, city: "New York" },
      { name: "Jane", age: 25, city: "Los Angeles" },
      { name: "Doe", age: 22, city: "Chicago" }
    ]
  }
  const table = jsonToTable(obj);
  console.log(json2DShape(obj));
  console.log(printTable(table));
  expect(table).toEqual({
    headers: ["users.name", "users.age", "users.city"],
    cells: [
      ["John", 30, "New York"],
      ["Jane", 25, "Los Angeles"],
      ["Doe", 22, "Chicago"]
    ],
  });
})

test("array_records", () => {
  const obj =
    [
      { name: "John", age: 30, city: "New York" },
      { name: "Jane", age: 25, city: "Los Angeles" },
      { name: "Doe", age: 22, city: "Chicago" }
    ]
  const table = jsonToTable(obj);
  console.log(json2DShape(obj));
  console.log(printTable(table));
  expect(table).toEqual({
    headers: ["name", "age", "city"],
    cells: [
      ["John", 30, "New York"],
      ["Jane", 25, "Los Angeles"],
      ["Doe", 22, "Chicago"]
    ],
  });
})

test("array_records_nested", () => {
  const obj =
    [
      { name: "John", age: 30, city: "New York", scores: { math: 90, science: 85 } },
      { name: "Jane", age: 25, city: "Los Angeles", scores: { math: 88, science: 92 } },
      { name: "Doe", age: 22, city: "Chicago", scores: { math: 95, science: 89 } }
    ]
  const table = jsonToTable(obj);
  console.log(json2DShape(obj));
  console.log(printTable(table));
  expect(table).toEqual({
    headers: ["name", "age", "city", "scores.math", "scores.science"],
    cells: [
      ["John", 30, "New York", 90, 85],
      ["Jane", 25, "Los Angeles", 88, 92],
      ["Doe", 22, "Chicago", 95, 89]
    ],
  });
})