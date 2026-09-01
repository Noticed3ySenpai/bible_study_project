export default function DataSourcesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold text-stone-900">Data Sources & Licenses</h1>
      <p className="mt-2 text-stone-600">
        This app uses openly licensed Bible and reference data.
      </p>

      <div className="mt-8 space-y-6">
        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold text-stone-900">World English Bible (WEB)</h2>
          <p className="mt-2 text-sm text-stone-600">
            Primary Bible text. Public domain worldwide.
          </p>
          <a
            href="https://github.com/midvash/bible-data"
            className="mt-2 inline-block text-sm text-amber-800 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            midvash/bible-data
          </a>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold text-stone-900">Strong&apos;s &amp; Word Study</h2>
          <p className="mt-2 text-sm text-stone-600">
            Hebrew and Greek dictionary from gnosis; New Testament word occurrences from
            STEPBible TAGNT. CC-BY license — attribution required.
          </p>
          <div className="mt-2 flex flex-col gap-1">
            <a
              href="https://github.com/spearssoftware/gnosis"
              className="text-sm text-amber-800 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              spearssoftware/gnosis
            </a>
            <a
              href="https://github.com/STEPBible/STEPBible-Data"
              className="text-sm text-amber-800 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              STEPBible/STEPBible-Data
            </a>
          </div>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold text-stone-900">Cross References</h2>
          <p className="mt-2 text-sm text-stone-600">
            Treasury of Scripture Knowledge cross-references from OpenBible.info. CC-BY license.
          </p>
          <a
            href="https://www.openbible.info/labs/cross-references/"
            className="mt-2 inline-block text-sm text-amber-800 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            openbible.info
          </a>
        </section>
      </div>
    </div>
  );
}
