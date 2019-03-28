async function publishProjectAsync(args) {
  return {
    success: true,
    origArgs: args,
  };
}

module.exports = {
  name: 'publishProject',
  fn: publishProjectAsync,
};
