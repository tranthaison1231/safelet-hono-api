export function csvToJson<T>(csv: string, splitter = ','): T[] {
  const [keys, ...rest] = csv
    .trim()
    .split('\n')
    .map((item) => item.split(splitter));

  const formedArr: T[] = rest.map((item) => {
    const object = {} as T;
    keys.forEach((key, index) => (object[key.replace(/"/g, '')] = item.at(index).replace(/"/g, '').trim()));
    return object;
  });
  return formedArr;
}
