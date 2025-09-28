module.exports = {
  testEnvironment: 'jsdom',
  // この設定ファイルがある場所（testsフォルダ）をテストのルートとして設定
  roots: ['.'], 
  // セットアップファイルへのパスを相対パスに修正
  setupFilesAfterEnv: ['./jest.setup.js'], 
  moduleNameMapper: {
    // CSSモックへのパスを相対パスに修正
    '\\.(css)$': './__mocks__/styleMock.js', 
  },
};

