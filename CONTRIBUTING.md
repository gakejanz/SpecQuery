# Contributing

Thanks for your interest in improving SpecQuery!

## Local Setup
1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Run the CLI against the sample spec: `node dist/cli.js --schema examples/petstore.yaml --out examples/out`

## Making Changes
- Keep runtime dependencies minimal—prefer devDependencies for tooling.
- Run `npm run build` before opening a pull request to ensure the published bundle is up to date.
- If you add or update generator behaviour, regenerate the fixtures in `examples/` so documentation stays accurate.
- Please add tests when practical, or document any gaps in coverage in your PR description.

## Release Process
1. Update `CHANGELOG.md`.
2. Bump the version in `package.json`.
3. Run `npm run build` and commit the `dist/` output for verification.
4. Publish with `npm publish`.
