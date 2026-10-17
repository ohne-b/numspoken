<div align="center">
  <img src="public/brand/numspoken.svg" width="110" alt="numspoken logo" />
  <h1>numspoken</h1>
  <p>Practise writing numbers in different languages.</p>
  <p>
    <a href="LICENSE.md"><img alt="License: PolyForm Noncommercial" src="https://img.shields.io/badge/license-PolyForm_Noncommercial-E56F51?style=flat-square" /></a>
    <a href="https://github.com/ohne-b/numspoken/actions/workflows/validation.yml"><img alt="Validation" src="https://img.shields.io/github/actions/workflow/status/ohne-b/numspoken/validation.yml?branch=main&label=checks&style=flat-square" /></a>
  </p>
</div>

![numspoken in dark mode](.github/assets/practice-dark.png)

Write the displayed number in words. Matching characters turn green as you type;
the first mismatch gets a subtle underline. A correct answer moves to the next number.
Use the eye to reveal an answer or the skip icon to move on.

Settings holds the language picker, number range, spelling preference and practice mode.
There are **50 languages and 72 regional/script variants**, powered by n2words. Start with
0–100 or choose any whole-number range up to 999,999. Practise continuously or in a fixed round.
The interface is English; answers use the selected language and script.

Preferences stay in your browser. Answers and practice history are never saved or sent away.
No account, scores, audio or tracking. When browser storage is unavailable, preferences
work for the current visit. Enter advances a completed or revealed answer; Escape closes
the language picker, then settings.

## Run locally

Install the Node version in [.nvmrc](.nvmrc), then:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/numspoken/`. Use `npm run build` and `npm run preview` to try
the production build. The app targets current Chromium, Firefox and Safari browsers.

## Contributing and hosting

See [CONTRIBUTING.md](CONTRIBUTING.md) for checks and the PR workflow.
Spelling corrections should include the variant, number and a linguistic source.
Library coverage is broad; automated converter checks are not a linguistic certification.

The static build is configured for GitHub Pages under `/numspoken/`. Once Pages is set to
GitHub Actions in repository settings, run **Validation** manually on `main` with **publish**
enabled to deploy the tested artifact. Ordinary merges do not deploy. No public deployment
is required to run the app locally.

## License and credits

Source available for noncommercial use under [PolyForm Noncommercial 1.0.0](LICENSE.md).
Third-party code and assets retain their original licenses; see [NOTICE.md](NOTICE.md).

Built with React, TypeScript, Vite, Tailwind CSS, Base UI, n2words, Material Design Icons,
flag-icons, Manrope and Noto. Inspired by [learn-numbers](https://github.com/J-Wass/learn-numbers)
and [diminumero](https://github.com/stefanwezel/diminumero).
