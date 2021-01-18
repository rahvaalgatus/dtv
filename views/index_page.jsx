/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("./page")
var {Header} = Page
var {Section} = Page
var {Heading} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {schools} = attrs
	var schoolsPath = req.baseUrl + "/schools"

	return <Page
		page="home"
		req={attrs.req}
		title="Kaasav Kool"
	>
		<Header>
			<h1>Kaasav Kool</h1>
		</Header>

		<Section id="intro-section">
			<p class="section-paragraph">
				2020.-2021. õppeaastal ühingu Korruptsioonivaba Eesti eestveetav kaasava eelarvestamise projekt koolides on esimene Eestis, kus kohalike omavalitsuste kaasava eelarvestamise eeskujul saavad õpilased välja töötada, arendada ja esitleda ideesid, mille vahel kooli kogukond valib kõige sobilikuma viisi eelarve kasutamiseks. Eesti Koostöö Kogu pakub projekti raames koolidele keskkonda, mis võimaldab õpilastel ettepanekuid esitada ja nende üle hääletada digitaalsel kujul.
			</p>

			<p class="section-paragraph">
				Ettevõtmise kaudu on õpilastel võimalus saada osa avatud (kooli)valitsemisest, kogukonnana otsustamisest ja enda elu puudutavates otsustes osalemisest, arendades sealhulgas ka infoühiskonnas toimimiseks vajalikke digipädevusi. Eesmärk on, et õpilased lihtsalt ei õpiks koolis, mis on demokraatia, vaid saaksid ka päriselulise demokraatias osalemise ja selle toimimises kaasa löömise kogemuse, mis loob loodetavasti eeldused ka hiljem väljaspool koolikeskkonda demokraatlikes protsessides osalemiseks.
			</p>

			<p class="section-paragraph">
				Projekt on saanud innustust Rootsi DigiDem Labi ning Transparency Internationali Leedu ühingu samasugustest ettevõtmistest. Projekti toetab Põhjamaade Ministrite Nõukogu.
			</p>
		</Section>

		<Section id="schools-section">
			<Heading>Koolid</Heading>

			<ul id="schools">{schools.map(function(school) {
				return <li>
					<a href={schoolsPath + "/" + school.id}>{school.name}</a>
				</li>
			})}</ul>
		</Section>
	</Page>
}
