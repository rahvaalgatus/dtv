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
				Ühingu <a href="https://www.transparency.ee">MTÜ Korruptsioonivaba Eesti</a> ning <a href="https://kogu.ee">SA Eesti Koostöö Kogu</a> algatatud kaasava eelarvestamise projekt koolides on esimene laiaulatuslikum ettevõtmine Eestis, kus kohalike omavalitsuste kaasava eelarvestamise eeskujul saavad õpilased välja töötada, arendada ja esitleda ideesid, mille vahel kooli kogukond valib kõige sobilikuma viisi eelarve kasutamiseks.
			</p>

			<p class="section-paragraph">
				Käesoleva lehe puhul on tegemist koolidele loodud keskkonnaga, kus õpilased saavad digitaalselt ettepanekuid esitada ja nende üle kaasaegseid e-vahendeid kasutades demokraatlikult hääletada. 

			</p>

			<p class="section-paragraph">
				Ettevõtmise eesmärk on suurendada õpilaste teadlikkust demokraatlikest otsustusprotsessidest ning aktiveerida neid koolielus kaasa rääkima.
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
