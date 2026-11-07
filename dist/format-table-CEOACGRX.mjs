import stringWidth from 'string-width';

const padCell = (text, width, align) => {
  const padding = width - stringWidth(text);
  if (padding <= 0) {
    return text;
  }
  const spaces = " ".repeat(padding);
  return align === "right" ? spaces + text : text + spaces;
};
const formatTable = (columns, rows, style) => {
  const columnWidths = columns.map((column, index) => {
    const headerWidth = column.header.length;
    const dataWidth = Math.max(0, ...rows.map((row) => stringWidth(row[index] ?? "")));
    return Math.max(headerWidth, dataWidth);
  });
  const gap = "  ";
  const buildLine = (cells) => columns.map((column, index) => padCell(
    cells[index] ?? "",
    columnWidths[index],
    column.align ?? "left"
  )).join(gap).trimEnd();
  const headerLine = buildLine(
    columns.map((column) => style.dim(column.header))
  );
  const dataLines = rows.map((row) => buildLine(row));
  return [headerLine, ...dataLines].join("\n");
};

export { formatTable as f };
