module.exports.messages = {
  newMessageWithBody: (body) => ({ body, headers: {} }),
  newEmptyMessage: () => ({ body: {}, headers: {} }),
};
