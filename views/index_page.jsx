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
			<a href="/assets/cover.jpg" id="cover-image">
				<img src="/assets/cover.jpg" />
			</a>

			<p class="section-paragraph">
				2020-2021. õppeaastal toetavad <a href="https://www.transparency.ee">MTÜ Korruptsioonivaba Eesti</a> ja <a href="https://kogu.ee">SA Eesti Koostöö Kogu</a> kaasava kooli pilootprojekti läbiviimist neljas erinevas Eesti koolis (Tallinna Rahumäe Põhikool, Keeni Põhikool, Rapla Gümnaasium, Tartu Annelinna Gümnaasium).
			</p>

			<p class="section-paragraph">
				Inspireerituna kohalikes omavalitsustes laialdaselt rakendatavast kaasava eelarve meetodist, katsetatakse pilootprojekti raames sarnast mudelit ka koolikeskkonnas. Projekti raames eraldavad koolid oma eelarvest summa, mille kasutamiseks saavad õpilased ise välja pakkuda ja esitleda kooli elu parandavaid ideekavandeid. Ideekavandite vahel toimub konkurss, mil kogukond saab anda hääle enim meeldivale või vajalikule projektile. Enim hääli saanud ideed teostatakse.
			</p>

			<p class="section-paragraph">
				<a href="https://kogu.ee">Eesti Koostöö Kogu</a> pakub projekti raames koolidele keskkonda, mis võimaldab õpilastel ettepanekuid esitada ja nende üle hääletada digitaalsel kujul. Ettevõtmise eesmärk on suurendada õpilaste teadlikkust demokraatlikest otsustusprotsessidest ning aktiveerida neid koolielus kaasa rääkima.
			</p>

			<p class="section-paragraph">
				Projekti kaudu saavad õpilased osa:
			</p>

			<ul class="section-list">
				<li>avatud (kooli)valitsemisest;</li>
				<li>kogukonnana otsustamisest ja enda elu puudutavates otsustes osalemisest;</li>
				<li>vajalike digipädevuste arendamisest.</li>
			</ul>

			<p class="section-paragraph">
				Eesmärk on, et õpilased lihtsalt ei õpiks koolis teoreetiliselt, mis on demokraatia, vaid saaksid ka päriselulise kaasa rääkimise ja koos otsustamise kogemuse. See loob eeldused tugevama kogukonna ja kodanikuühiskonna arenguks.
			</p>

			<p class="section-paragraph">
				Projekt on saanud innustust <a href="https://digidemlab.org/en/">Rootsi DigiDem</a> Labi ning <a href="https://www.transparency.lt/en/">Transparency Internationali Leedu</a> ühingu samasugustest ettevõtmistest. Projekti toetab <a href="https://www.norden.ee/et/">Põhjamaade Ministrite Nõukogu</a>.
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
