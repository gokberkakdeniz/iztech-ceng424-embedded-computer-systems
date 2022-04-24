import React from "react";
import clsx from "clsx";

const Table = ({ children, className, ...rest }) => {
  return (
    <table {...rest} className={clsx(className)}>
      {children}
    </table>
  );
};

const TableHead = ({ children, className, ...rest }) => {
  return (
    <thead {...rest} className={clsx("bg-gray-800", className)}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className, ...rest }) => {
  return (
    <tbody {...rest} className={clsx(className)}>
      {children}
    </tbody>
  );
};

const TableTr = ({ children, className, ...rest }) => {
  return (
    <tr {...rest} className={clsx(className)}>
      {children}
    </tr>
  );
};

const TableTd = ({ children, className, ...rest }) => {
  return (
    <td {...rest} className={clsx("border border-gray-800 p-1", className)}>
      {children}
    </td>
  );
};

const TableTh = ({ children, className, ...rest }) => {
  return (
    <th {...rest} className={clsx("border border-gray-800 p-1", className)}>
      {children}
    </th>
  );
};

Table.tr = TableTr;
Table.td = TableTd;
Table.th = TableTh;
Table.body = TableBody;
Table.head = TableHead;

export default Table;
