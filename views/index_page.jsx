/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("./page")
var {Section} = Page
var {Heading} = Page
var {Centered} = Page
module.exports = IndexPage

function IndexPage(attrs) {
	var {req} = attrs

	return <Page
		page="home"
		req={req}
		title="Demokraatia töövihik"
		homeless
	>
		<header id="header">
			<Centered>
				<h1>
					<img src="/assets/logo.svg" alt="Demokraatia töövihik" class="logo" />

					<span class="subtitle">
						Kolme harjutusega koolinoorest aktiivseks kodanikuks!
					</span>
				</h1>


				<div class="call-to-actions">
					<Heading>Harjutused</Heading>

					<img src="/assets/home-illustration.png" alt="" class="illustration" />

					<ul>
						<li>
							<a class="yellow-button" href="/eelarve">
								Koolide kaasav<br />eelarve
							</a>
						</li>

						<li>
							<a class="yellow-button" href="https://vali.rahvaalgatus.ee">
								Õpilasesinduse<br />valimine
							</a>
						</li>

						<li>
							<a class="yellow-button" href="https://rahvaalgatus.ee/digiallkiri">
								Harjuta<br />digiallkirjastamist
							</a>
						</li>
					</ul>
				</div>
			</Centered>
		</header>

		<Section>
			<p class="section-paragraph">
				Kool on koht, kus noored saavad esimesed kogemused demokraatias osalemisest. Hea kool on kaasav, osalemist soodustav, märkamist ja loovust toetav. Siinne Demokraatia töövihik on Eesti Koostöö Kogu poolt loodud õpikeskkond, kus noored saavad harjutada aktiivsele kodanikule olulisi digioskusi ja proovida ka ise koolielus kaasa rääkida ning muutusi luua.
			</p>

			<p class="section-paragraph">
				SA Eesti Koostöö Kogu on mõttekoda, mis muuhulgas edendab osalusdemokraatiat ja avatud valitsemist ja on osalusportaali Rahvaalgatus.ee kureerija.
			</p>
		</Section>

		<Section id="exercises-section" wide>
			<Heading>Harjutused</Heading>

			<ul>
				<li class="exercise">
					<a class="yellow-button budgeting-button" href="/eelarve">
						Koolide kaasav<br />eelarve
					</a>

					<p class="section-paragraph">Siin saab kooli esindaja üles laadida kaasava eelarvestamise ideid ning õpilased saavad nende poolt digihääletada.</p>
				</li>

				<li class="exercise">
					<a
						class="yellow-button election-button"
						href="https://vali.rahvaalgatus.ee"
					>
						Õpilasesinduse<br />valimine
					</a>

					<p class="section-paragraph">Siin saab korraldada turvalises veebikeskkonnas õpilasesinduste hääletusi.</p>
				</li>

				<li class="exercise">
					<a
						class="yellow-button signing-button"
						href="https://rahvaalgatus.ee/digiallkiri"
					>
						Harjuta<br />digiallkirjastamist
					</a>

					<p class="section-paragraph">Nii nagu autokoolis alustatakse turvalist harjutamist kinnisel platsil, saad ka sellel leheküljel turvaliselt proovida digiallkirja andmist. Siin saad sa proovida digiallkirja andmist nii ID-kaardi, Mobiil-ID kui ka Smart-ID kaudu.</p>
				</li>
			</ul>
		</Section>
	</Page>
}
