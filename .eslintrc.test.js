module.exports = {
  // Specifies the ESLint parser which allows it to parse TypeScript
  parser: '@typescript-eslint/parser',
  extends: [
    'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    'plugin:prettier/recommended' // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  parserOptions: {
    // Allows for the parsing of modern ECMAScript features
    ecmaVersion: 2018,
    // Allows for the use of imports
    sourceType: 'module',
    project: './tsconfig.json'
  },
  // Enables us to use rules available in these plugins
  plugins: ['@typescript-eslint'],
  rules: {
    // Possible Errors

    // Enforce “for” loop update clause moving the counter in the right direction.
    'for-direction': 'error',
    // Disallow await inside of loops
    'no-await-in-loop': 'error',
    // Disallow assignment operators in conditional statements
    'no-cond-assign': 'error',
    // Disallow the use of console
    'no-console': 'error',
    // Disallow constant expressions in conditions
    'no-constant-condition': 'error',
    // Disallow control characters in regular expressions
    'no-control-regex': 'error',
    // Disallow the use of debugger
    'no-debugger': 'error',
    // Disallow duplicate arguments in function definitions
    'no-dupe-args': 'error',
    // Disallow duplicate keys in object literals
    'no-dupe-keys': 'error',
    // Disallow a duplicate case label
    'no-duplicate-case': 'error',
    // Disallow empty block statements
    'no-empty': 'error',
    // Disallow empty character classes in regular expressions
    'no-empty-character-class': 'error',
    // Disallow reassigning exceptions in catch clauses
    'no-ex-assign': 'error',
    // Disallow unnecessary boolean casts
    'no-extra-boolean-cast': 'error',
    // Disallow unnecessary semicolons
    'no-extra-semi': 'error',
    // Disallow reassigning function declarations
    'no-func-assign': 'error',
    // Disallow invalid regular expression strings in RegExp constructors
    'no-invalid-regexp': 'error',
    // Disallow irregular whitespace
    'no-irregular-whitespace': 'error',
    // Disallow characters which are made with multiple code points in character class syntax
    'no-misleading-character-class': 'error',
    // Disallow calling global object properties as functions
    'no-obj-calls': 'error',
    // Disallow use of Object.prototypes builtins directly
    'no-prototype-builtins': 'error',
    // Disallow multiple spaces in regular expression literals
    'no-regex-spaces': 'error',
    // Disallow sparse arrays
    'no-sparse-arrays': 'error',
    // Disallow template literal placeholder syntax in regular strings
    'no-template-curly-in-string': 'error',
    // Disallow confusing multiline expressions
    'no-unexpected-multiline': 'error',
    // Disallow unreachable code after return, throw, continue, and break statements
    'no-unreachable': 'error',
    // Disallow control flow statements in finally blocks
    'no-unsafe-finally': 'error',
    // Disallow negating the left operand of relational operators
    'no-unsafe-negation': 'error',
    // Disallow assignments that can lead to race conditions due to usage of await or yield
    'require-atomic-updates': 'error',
    // Require calls to isNaN() when checking for NaN
    'use-isnan': 'error',
    // Enforce comparing typeof expressions against valid strings
    'valid-typeof': 'error',

    // Best Practices

    // Enforces return statements in callbacks of array’s methods
    'array-callback-return': 'error',
    // Limit Cyclomatic Complexity
    complexity: 'error',
    // Require Following Curly Brace Conventions
    curly: 'error',
    // Require Default Case in Switch Statements
    'default-case': 'error',
    // Require Dot Notation
    'dot-notation': 'error',
    // Require === and !==
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    // Require Guarding for-in
    'guard-for-in': 'error',
    // Enforce a maximum number of classes per file
    'max-classes-per-file': 'error',
    // Disallow Use of Alert
    'no-alert': 'error',
    // Disallow Use of caller/callee
    'no-caller': 'error',
    // Disallow lexical declarations in case/default clauses
    'no-case-declarations': 'error',
    // Disallow empty functions
    'no-empty-function': ['error', { allow: ['constructors'] } ],
    // Disallow empty destructuring patterns
    'no-empty-pattern': 'error',
    // Disallow eval()
    'no-eval': 'error',
    // Disallow unnecessary function binding
    'no-extra-bind': 'error',
    // Disallow Unnecessary Labels
    'no-extra-label': 'error',
    // Disallow Case Statement Fallthrough
    'no-fallthrough': 'error',
    // Disallow Floating Decimals
    'no-floating-decimal': 'error',
    // Disallow assignment to native objects or read-only global variables
    'no-global-assign': 'error',
    // Disallow the type conversion with shorter notations
    'no-implicit-coercion': 'error',
    // Disallow this keywords outside of classes or class-like objects
    'no-invalid-this': 'error',
    // Disallow Labeled Statements
    'no-labels': 'error',
    // Disallow Unnecessary Nested Blocks
    'no-lone-blocks': 'error',
    // Disallow Functions in Loops
    'no-loop-func': 'error',
    // We use the @typescript-eslint/no-magic-numbers below instead,
    'no-magic-numbers': 'off',
    // Disallow Multiline Strings
    'no-multi-str': 'error',
    // Disallow new For Side Effects
    'no-new': 'error',
    // Disallow Function Constructor
    'no-new-func': 'error',
    // Disallow Primitive Wrapper Instances
    'no-new-wrappers': 'error',
    // Disallow octal literals
    'no-octal': 'error',
    // Disallow octal escape sequences in string literals
    'no-octal-escape': 'error',
    // Disallow Reassignment of Function Parameters
    'no-param-reassign': 'error',
    // Disallow Use of __proto__
    'no-proto': 'error',
    // Disallow Assignment in return Statement
    'no-return-assign': 'error',
    // Disallows unnecessary return await
    'no-return-await': 'error',
    // Disallow Self Assignment
    'no-self-assign': 'error',
    // Disallow Self Compare
    'no-self-compare': 'error',
    // Disallow Use of the Comma Operator
    'no-sequences': 'error',
    // Restrict what can be thrown as an exception
    'no-throw-literal': 'error',
    // Disallow unmodified conditions of loops
    'no-unmodified-loop-condition': 'error',
    // Disallow Unused Expressions
    'no-unused-expressions': 'error',
    // Disallow unnecessary .call() and .apply()
    'no-useless-call': 'error',
    // Disallow unnecessary catch clauses
    'no-useless-catch': 'error',
    // Disallow unnecessary concatenation of strings
    'no-useless-concat': 'error',
    // Disallow unnecessary escape usage
    'no-useless-escape': 'error',
    // Disallow redundant return statements
    'no-useless-return': 'error',
    // Disallow use of the void operator
    'no-void': 'error',
    // Disallow with statements
    'no-with': 'error',
    // Suggest using named capture group in regular expression
    'prefer-named-capture-group': 'error',
    // Require using Error objects as Promise rejection reasons
    'prefer-promise-reject-errors': 'error',
    // Require Radix Parameter
    radix: 'error',
    // Enforce the use of u flag on RegExp
    'require-unicode-regexp': 'error',

    // Variables

    // Disallow deleting variables
    'no-delete-var': 'error',
    // Disallow variable declarations from shadowing variables declared in the outer scope
    'no-shadow': 'error',
    // Disallow Shadowing of Restricted Names
    'no-shadow-restricted-names': 'error',
    // Disallow Initializing to undefined
    'no-undef-init': 'error',
    // We use the @typescript-eslint/no-unused-vars below instead,
    'no-unused-vars': 'off',

    // Node.js and CommonJS

    // Disallow process.exit()
    'no-process-exit': 'error',

    // Stylistic Issues

    // Enforce spaces inside of brackets
    'array-bracket-spacing': 'error',
    // Enforce spaces inside of blocks after opening block and before closing block
    'block-spacing': 'error',
    // Require Brace Style
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    // We use the @typescript-eslint/camelcase below instead
    camelcase: 'off',
    // Disallow trailing commas
    'comma-dangle': 'error',
    // Enforces spacing around commas
    'comma-spacing': 'error',
    // Requires a comma after and on the same line as an array element, object property, or variable declaration
    'comma-style': 'error',
    // Disallow spaces inside of computed properties
    'computed-property-spacing': 'error',
    // Require newline at the end of files
    'eol-last': 'error',
    // Disallow spacing between function identifiers and their invocations
    'func-call-spacing': 'error',
    // Enforce the consistent use of function expressions
    'func-style': 'error',
    // Enforce consistent indentation
    //    "indent":                                              [ "error", 2 ], // No way to have chopped down spacing
    // Enforce consistent spacing between keys and values in object literal properties
    //    "key-spacing":                                         [ "error", { "align": "value" } ], // Doesn't handle multiline values
    // Enforce consistent spacing before and after keywords
    'keyword-spacing': 'error',
    // Enforce position of line comments
    'line-comment-position': 'error',
    // Enforce consistent linebreak style
    'linebreak-style': 'error',
    // Eequire or disallow an empty line between class members
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    // Enforce a maximum depth that blocks can be nested
    'max-depth': ['error', 3],
    // Enforce a maximum depth that callbacks can be nested
    'max-nested-callbacks': 'error',
    // Enforce a particular style for multiline comments
    'multiline-comment-style': 'error',
    // Require parentheses when invoking a constructor with no arguments
    'new-parens': 'error',
    // Require a newline after each call in a method chain
    'newline-per-chained-call': 'error',
    // We use the @typescript-eslint/no-array-constructor below instead,
    'no-array-constructor': 'off',
    // Disallow bitwise operators
    'no-bitwise': 'error',
    // Disallow inline comments after code
    'no-inline-comments': 'error',
    // Disallow if statements as the only statement in else blocks
    'no-lonely-if': 'error',
    // Disallow mixes of different operators
    'no-mixed-operators': 'error',
    // Disallow mixed spaces and tabs for indentation
    'no-mixed-spaces-and-tabs': 'error',
    // Disallow Use of Chained Assignment Expressions
    'no-multi-assign': 'error',
    // Disallow multiple empty lines
    'no-multiple-empty-lines': 'error',
    // Disallow negated conditions
    'no-negated-condition': 'error',
    // Disallow nested ternary expressions
    'no-nested-ternary': 'error',
    // Disallow Object constructors
    'no-new-object': 'error',
    // Disallow all tabs
    'no-tabs': 'error',
    // Disallow trailing whitespace at the end of lines
    'no-trailing-spaces': 'error',
    // Disallow ternary operators when simpler alternatives exist
    'no-unneeded-ternary': 'error',
    // Disallow whitespace before properties
    'no-whitespace-before-property': 'error',
    // Enforce consistent line breaks inside braces
    'object-curly-newline': 'error',
    // Enforce consistent spacing inside braces
    'object-curly-spacing': ['error', 'always'],
    // Enforce variables to be declared either together or separately in functions
    'one-var': ['error', 'never'],
    // Require assignment operator shorthand where possible
    'operator-assignment': 'error',
    // Prefer use of an object spread over Object.assign
    'prefer-object-spread': 'error',
    // Require quotes around object literal property names
    'quote-props': ['error', 'as-needed'],
    // Enforce the consistent use of either single quotes
    quotes: ['error', 'single', { avoidEscape: true }],
    // Require semicolons instead of ASI
    semi: 'error',
    // Enforce spacing before and after semicolons
    'semi-spacing': 'error',
    // Enforce location of semicolons
    'semi-style': 'error',
    // Require Space Before Blocks
    'space-before-blocks': 'error',
    // Disallow a space before function parenthesis
    'space-before-function-paren': ['error', { anonymous: 'never', named: 'never', asyncArrow: 'always' }],
    // Disallow spaces inside of parentheses
    'space-in-parens': 'error',
    // Require spacing around infix operators
    'space-infix-ops': 'error',
    // Disallow spaces before/after unary operators
    'space-unary-ops': ['error', { words: true, nonwords: false }],
    // Requires a whitespace (space or tab) beginning a comment
    'spaced-comment': 'error',
    // Enforce spacing around colons of switch statements
    'switch-colon-spacing': 'error',

    // ECMAScript 6

    // Require braces in arrow function body
    'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: true }],
    // Require space before/after arrow function’s arrow
    'arrow-spacing': 'error',
    // Verify calls of super() in constructors
    'constructor-super': 'error',
    // Enforce spacing around the * in generator functions
    'generator-star-spacing': 'error',
    // Disallow modifying variables of class declarations
    'no-class-assign': 'error',
    // Disallow modifying variables that are declared using const
    'no-const-assign': 'error',
    // Disallow duplicate name in class members
    'no-dupe-class-members': 'error',
    // Disallow duplicate imports
    'no-duplicate-imports': 'error',
    // Disallow Symbol Constructor
    'no-new-symbol': 'error',
    // Disallow use of this/super before calling super() in constructors
    'no-this-before-super': 'error',
    // Disallow unnecessary computed property keys on objects
    'no-useless-computed-key': 'error',
    // we use the @typescript-eslint/no-useless-constructor below instead
    'no-useless-constructor': 'off',
    // Disallow renaming import, export, and destructured assignments to the same name
    'no-useless-rename': 'error',
    // Require let or const instead of var
    'no-var': 'error',
    // Require using arrow functions for callbacks
    'prefer-arrow-callback': 'error',
    // Suggest using const
    'prefer-const': 'error',
    // Prefer destructuring from arrays and objects
    'prefer-destructuring': 'error',
    // Suggest using the rest parameters instead of arguments
    'prefer-rest-params': 'error',
    // Suggest using spread syntax instead of .apply()
    'prefer-spread': 'error',
    // Suggest using template literals instead of string concatenation
    'prefer-template': 'error',
    // Enforce spacing between rest and spread operators and their expressions
    'rest-spread-spacing': 'error',
    // Require symbol description
    'symbol-description': 'error',
    // Enforce Usage of Spacing in Template Strings
    'template-curly-spacing': 'error',

    // General TS/JS Rules
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/array-type': ['error', 'array'],
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          Boolean: {
            fixWith: 'boolean',
            message: 'Avoid using the `Boolean` type. Did you mean `boolean`?'
          },
          Function: {
            message: 'Avoid using the `Function` type. Prefer a specific function type like `() => void`.'
          },
          Number: {
            fixWith: 'number',
            message: 'Avoid using the `Number` type. Did you mean `number`?'
          },
          Object: {
            message: 'Avoid using the `Object` type. Did you mean `object`?'
          },
          String: {
            fixWith: 'string',
            message: 'Avoid using the `String` type. Did you mean `string`?'
          },
          Symbol: {
            fixWith: 'symbol',
            message: 'Avoid using the `Symbol` type. Did you mean `symbol`?'
          }
        }
      }
    ],
    '@typescript-eslint/camelcase': 'error',
    '@typescript-eslint/class-name-casing': 'error',
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true, allowTypedFunctionExpressions: true }],
    '@typescript-eslint/explicit-member-accessibility': 'error',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/member-delimiter-style': 'error',
    '@typescript-eslint/no-angle-bracket-type-assertion': 'error',
    '@typescript-eslint/no-array-constructor': 'error',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-extraneous-class': 'error',
    '@typescript-eslint/no-for-in-array': 'error',
    '@typescript-eslint/no-inferrable-types': ['error', { ignoreProperties: true, ignoreParameters: true }],
    '@typescript-eslint/no-magic-numbers': 'off',
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-namespace': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'error',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-require-imports': 'error',
    '@typescript-eslint/no-triple-slash-reference': 'error',
    '@typescript-eslint/no-unnecessary-qualifier': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
    '@typescript-eslint/no-use-before-define': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/prefer-for-of': 'error',
    '@typescript-eslint/prefer-includes': 'error',
    '@typescript-eslint/prefer-interface': 'error',
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',
    //    "@typescript-eslint/promise-function-async": "error", This rule triggers on functions that return `unknown`, which isn't helpful
    '@typescript-eslint/require-array-sort-compare': 'error',
    '@typescript-eslint/type-annotation-spacing': 'error',
    '@typescript-eslint/unbound-method': 'error'
  }
};
