module.exports = {
    transform: {
        '^.+\\.(test|spec).(t|j)s$': [
            '@swc/jest',
            {
                module: {
                    type: 'commonjs'
                },
                jsc: {
                    target: 'es2019',
                    externalHelpers: false,
                }
            }
        ]
    },
    moduleNameMapper: {
        '^@modules(.*)$': '<rootDir>/build/modules$1',
        '^@services(.*)$': '<rootDir>/build/services$1',
        '^~(.*)$': '<rootDir>/build$1'
    }
}
