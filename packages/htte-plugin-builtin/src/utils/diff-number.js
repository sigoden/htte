module.exports = function(context, literal, actual, fn) {
  let numLiteral = numeral(literal).value();
  if (numLiteral === null) {
    context.throw('literal value cannot convert to number');
  }
  let numActual = numeral(actual).value();
  if (numActual === null) {
    context.throw('actual value cannot convert to number');
  }
  return fn(numLiteral, numActual);
};
