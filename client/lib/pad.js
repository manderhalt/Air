// add leading characters (default 0) to get width caracters with n
// example: pad(3,4,0) = '0003'
pad = function (n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
