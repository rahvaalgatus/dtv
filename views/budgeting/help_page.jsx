/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var {HeroHeader} = require("./index_page")
var {Section} = Page
var {Heading} = Page

module.exports = function(attrs) {
	return <Page
		page="budgeting-help"
		req={attrs.req}
		title="Õppevahendid"
	>
		<HeroHeader title="Õppe&shy;vahendid">
			<p>
				Alt leiad koolide kaasava eelarvestamise meetodit läbiviijale tutvustava <strong><a href="#info" class="link-button">infotunni</a></strong>, töötubade <strong><a href="#workshop" class="link-button">õppevideod</a></strong> ja <strong><a href="#book" class="link-button">juhendraamatu</a></strong>. Õppevideod on saadaval eesti ja vene subtiitritega ning juhendraamat on eesti, inglise ja vene keeles.
			</p>
		</HeroHeader>

		<Section id="info">
			<Heading>Infotund</Heading>

			<p class="section-paragraph">
				Oled mõtlemas oma koolis kaasavat eelarvestamist läbi viia? Meie 2022. aasta kevadel korraldatud infotund aitab sul selles põnevas teemas paremini orienteeruda:
			</p>

			<Video
				name="intro-video"
				title="Kaasav eelarve koolis infotund"
				href="https://www.youtube.com/watch?v=Ie7vrxY4u3A"
				src="https://www.youtube-nocookie.com/embed/Ie7vrxY4u3A"
			/>

			<table class="timestamps">
				<tbody>
					{[
						[1, "0:01", "Sissejuhatus, üldinfo"],
						[341, "5:41", "Kaasava eelarvestamise mõju"],
						[492, "8:12", "Kaasava eelarvestamise praktiline läbiviimine"],
						[981, "16:21", "Sügis 2022 plaanid"],
						[1282, "21:22", "Rapla Gümnaasiumi kogemuslugu"],
						[2030, "33:50", "Küsimused ja vastused"],
					].map(([at, range, description]) => <tr>
						<td>
							<a href={`https://www.youtube-nocookie.com/embed/Ie7vrxY4u3A?start=${at}&autoplay=1`} target="intro-video">
								{range}
							</a>
						</td>

						<td>{description}</td>
					</tr>)}
				</tbody>
			</table>
		</Section>

		<Section id="info">
			<Heading>Animatsioon</Heading>

			<p class="section-paragraph">
				Kuidas koolide kaasavat eelarvestamist õpilastele reklaamida? Siin tuleb abiks lühike ja kaasahaarav video, kus selgitatakse, mis on kaasav eelarvestamine, miks seda vaja on ning miks selles osalema peaks. Videot võib kasutada lisaks tunnis näitamisele ka näiteks kooli siseveebis, sotsiaalmeedias või kooli ekraanidel.
			</p>

			<Video
				title="Kaasav eelarve koolis animatsioon"
				href="https://www.youtube.com/watch?v=UxUbGb8l3W4"
				src="https://www.youtube-nocookie.com/embed/UxUbGb8l3W4"
			/>
		</Section>

		<Section id="workshop">
			<Heading>Töötuba</Heading>

			<p class="section-paragraph">
				Kuidas koolide kaasava eelarvestamist laiemale kooliperele tutvustada?  Lähtuvalt meie praktilisest kogemusest, soovitame korraldada neljaosaline (kokku umbes 1 tund) töötuba, mis võiks konstruktiivsuse mõttes toimuda maksimaalselt 100 õpilasele korraga.
			</p>

			<p class="section-paragraph">
				Töötuba võiks olla üles ehitatud nii:
			</p>

			<ol>
				<li>
					<p class="section-paragraph">
						Koolipoolne esindaja annab ülevaate koolieelarve mahust, jaotumisest, struktuurist ning tsüklist. <span class="duration">Kestus: 10 minutit.</span>
					</p>
				</li>

				<li>
					<p class="section-paragraph">
						Võimalusel jagab kohaliku omavalitsuse esindaja kaasava eelarvestamise kogemust teie kohalikus omavalitsuses. <span class="duration">Kestus: 10 minutit.</span>
					</p>
				</li>

				<li>
					<p class="section-paragraph">
						Korruptsioonivaba Eesti videoloeng demokraatiast, korruptsioonist, kodanikuaktiivsusest ning kaasavast eelarvestamisest. Kust see pärineb, miks, mida ja kus selle abil maailmas ning Eestis ära tehtud on. <span class="duration">Kestus: 10 minutit.</span>
					</p>

					<Video
						title="Demokraatiast, korruptsioonist ja kodanikuaktiivsusest"
						href="https://www.youtube.com/watch?v=ddqJrZ7fhzA"
						src="https://www.youtube-nocookie.com/embed/ddqJrZ7fhzA"
					/>

					<Video
						title="Ideekorje"
						href="https://www.youtube.com/watch?v=g0aM0AaRTVE"
						src="https://www.youtube-nocookie.com/embed/g0aM0AaRTVE"
					/>
				</li>

				<li>
					<p class="section-paragraph">
						Ideekorje, kus iga õpilane saab paberile kirjutada ühe idee. Need korjatakse kokku ning grupeeritakse järgmiste osade ajal. <span class="duration">Kestus: 10 minutit.</span>
					</p>

					<Video
						title="Ideest võiduka teostuseni"
						href="https://www.youtube.com/watch?v=rEj3jKt8HxM"
						src="https://www.youtube-nocookie.com/embed/rEj3jKt8HxM"
					/>

				</li>

				<li>
					<p class="section-paragraph">
						Eesti Koostöö Kogu tutvustab videoloenguga õpilastele, mis on digiallkiri ning kuidas toimib e-hääletamine ja laiemalt, kuidas saab digivahendeid kasutades demokraatlikes protsessides kaasa lüüa. <span class="duration">Kestus: 8 minutit.</span>
					</p>

					<Video
						title="Demokraatias osalemise võimalused ja viisid"
						href="https://www.youtube.com/watch?v=qBZJpzfuaRg"
						src="https://www.youtube-nocookie.com/embed/qBZJpzfuaRg"
					/>
				</li>

				<li>
					<p class="section-paragraph">
						Tutvustage ideekorje tulemusi, õpilased võivad ka end juba ideede juurde kirja panna. Ideed jäävad projekti eest vastutava isiku kätte. <span class="duration">Kestus: 5 minutit.</span>
					</p>
				</li>
			</ol>
		</Section>

		<Section id="book">
			<Heading>Juhendraamat</Heading>

			<p class="section-paragraph">
				Käsiraamat, mis on mõeldud kasutamiseks õpetajatele ja koolidele, et toetada kaasava eelarvestamise läbiviimist, on leitav nii eesti keeles, inglise keeles kui ka vene keeles. Juhendraamatusse on koondatud statistikat, häid näiteid, võimalikke edasiarendusi ja ka üksikasjalik läbiviimise juhend.
			</p>

			<div class="download-links">
				<a
					href="/eelarve/abi/handbook.et.pdf"
					class="green-button"
					download="Kaasav eelarvestamine -- Käsiraamat koolidele (2021).pdf"
				>
					Lae alla juhendraamat eesti keeles
				</a>

				<a
					href="/eelarve/abi/handbook.en.pdf"
					class="green-button"
					download="Participatory budgeting -- A handbook for schools (2021).pdf"
				>
					Lae alla juhendraamat inglise keeles
				</a>

				<a
					href="/eelarve/abi/handbook.ru.pdf"
					class="green-button"
					download="Народный бюджет -- Справочник для школ (2021).pdf"
				>
					Lae alla juhendraamat vene keeles
				</a>
			</div>

			<p class="section-paragraph">
				Koolide kaasava eelarvestamise õppematerjalide loomisele pani oma õla projektirahastajana alla <a href="https://acf.ee">Aktiivsete Kodanike Fond</a>.
			</p>

			<div class="supporter-logos">
				<a href="https://acf.ee">
					<img
						src="/assets/acf.svg"
						title="Aktiivsete Kodanike Fond"
						alt="Aktiivsete Kodanike Fond"
					/>
				</a>
			</div>
		</Section>
	</Page>
}

function Video(attrs) {
	return <div class="video">
		<iframe
			name={attrs.name}
			src={attrs.src}
			width="560"
			height="315"
			title={attrs.title}
			scrolling="no"
			allow="autoplay; encrypted-media; picture-in-picture"
			allowfullscreen
			loading="lazy"
		/>
	</div>
}
