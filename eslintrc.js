module.exports = {
  "env": {
    "browser": true,
    "es2017": true,
    "jest": true
  },
  "extends": [
    "airbnb",
    "airbnb-typescript",
    "plugin:react-hooks/recommended",
    "plugin:sonarjs/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:storybook/recommended"
  ],
  "plugins": [
    "@typescript-eslint",
    "prettier",
    "sonarjs",
    "disable",
    "@wrs",
    "simple-import-sort"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 8,
    "sourceType": "module",
    "ecmaFeatures": {
      "modules": true
    },
    "project": "./tsconfig.json"
  },
  "processor": "disable/disable",
  "rules": {
    "@typescript-eslint/ban-types": [
      "error",
      {
        "extendDefaults": true,
        "types": {
          "{}": false,
          "Object": false
        }
      }
    ],
    "@typescript-eslint/indent": "off", // ESLint's indent rule and Prettier's indentation styles do not match
    "@typescript-eslint/no-use-before-define": "off",
    "@wrs/named-use-effect": ["error", { "max": 10, "naming": "comment" }],
    "@wrs/no-new-date": ["error", { allowEmptyArgument: true }],
    "consistent-return": "off",
    "class-methods-use-this": "off",
    "curly": ["error", "all"],
    "id-length": [
      "error",
      {
        "min": 2,
        "exceptions": ["_", "$", "i", "e"]
      }
    ],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "ts": "never",
        "tsx": "never",
        "js": "never",
        "": "never"
      }
    ],
    "import/no-cycle": "off",
    "import/no-extraneous-dependencies": "off",
    "import/prefer-default-export": "off",
    "no-alert": "off",
    "no-bitwise": "off",
    "no-new": "off",
    "no-plusplus": [
      "error",
      {
        "allowForLoopAfterthoughts": true
      }
    ],
    "no-underscore-dangle": "off", // sometimes for backward compatibility reasons we need to have undescore in variable names
    "no-param-reassign": [
      "error",
      {
        "props": true,
        "ignorePropertyModificationsFor": [
          "draft",
          "state"
        ]
      }
    ],
    "prettier/prettier": [
      "error",
      {
        "trailingComma": "es5",
        "tabWidth": 2,
        "singleQuote": true,
        "printWidth": 100
      }
    ],
    "react/function-component-definition": [
      "error",
      {
        "namedComponents": ["function-declaration", "arrow-function"]
      }
    ],
    "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
    "react-hooks/exhaustive-deps": "warn", // Checks effect dependencies
    "react/jsx-key": [
      "error",
      {
        "warnOnDuplicates": true,
        "checkFragmentShorthand": true
      }
    ],
    "react/jsx-no-bind": "off",
    "react/no-unstable-nested-components": [
      "error",
      {
        "allowAsProps": true
      }
    ],
    "react/no-unused-prop-types": 1,
    "react/prefer-stateless-function": "off",
    "react/require-default-props": "off",
    "react/react-in-jsx-scope": "off",
    "simple-import-sort/imports": [
      "error",
      {
        "groups": [
          ["^react", "^styled-components", "^@?\\w"],
          ["^@wrs\\/"],
          ["^#"],
          ["^(\\.\\.\\/){2,}", "^\\.\\.\\/\\w"],
          ["^\\.\\/(\\w[\\w.-]*)\\/.+"],
          ["^\\.\\/(\\w[\\w.-]*)$"]
        ]
      }
    ]
  },
  "settings": {
    "disable/plugins": [
      "jsx-a11y"
    ],
    "import/resolver": {
      "node": {
        "extensions": [
          ".js",
          ".jsx",
          ".ts",
          ".tsx"
        ]
      }
    }
  },
  "overrides": [
    {
      "files": [
        "*.ts",
        "*.tsx"
      ],
      "rules": {
        "react/prop-types": [
          "off"
        ],
        "react/jsx-props-no-spreading": [
          "off"
        ],
        "react/require-default-props": [
          "off"
        ]
      }
    },
    {
      "files": "selectors.ts",
      "rules": {
        "@typescript-eslint/explicit-module-boundary-types": [
          "off"
        ]
      }
    },
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:jest/recommended', 'plugin:testing-library/react'],
      rules: {
        'sonarjs/no-duplicate-string': 'off',
        'testing-library/prefer-user-event': 'error',
        'testing-library/no-await-sync-events': [
          'error',
          { eventModules: ['fire-event'] },
        ],
      }
    },
  ],
  "ignorePatterns": [
    ".storybook/",
    "node_modules/",
    "dist/",
    "www/**/lib/",
    "upload/",
    "vendor/",
    "logs/",
    "webpack.*.js"
  ]
}
