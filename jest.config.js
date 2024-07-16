module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    testMatch: ['**/*.test.ts'],
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.jest.json',
        },
    },
};
