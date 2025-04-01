function timestampToDateTime(timestamp) {
  const year = parseInt(timestamp.substring(0, 2));
  const month = timestamp.substring(2, 4);
  const day = timestamp.substring(4, 6);

  const hour = timestamp.substring(6, 8);
  const minute = timestamp.substring(8, 10);
  const second = timestamp.substring(10, 12);

  const fullYear = year < 50 ? `20${year}` : `19${year}`;

  return `${day}/${month}/${fullYear} ${hour}:${minute}:${second}`;
}

module.exports = timestampToDateTime;
