/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var Page = require("../page")
var {HeroHeader} = require("./index_page")
var {Section} = Page
var {Heading} = Page

module.exports = function({req, t}) {
	var timestamps = t("budgeting_help_page.info.video_timestamps")
		.split("\n")
		.map((timestamp) => _.split2(timestamp, " "))

	return <Page
		page="budgeting-help"
		req={req}
		title={t("budgeting_help_page.title")}
	>
		<HeroHeader title={t("budgeting_help_page.header.title")}>
			<p>{Jsx.html(t("budgeting_help_page.header.description"))}</p>
		</HeroHeader>

		<Section id="info">
			<Heading>{t("budgeting_help_page.info.title")}</Heading>

			<p class="section-paragraph">
				{t("budgeting_help_page.info.description")}
			</p>

			<Video
				name="intro-video"
				title="Kaasav eelarve koolis infotund"
				href="https://www.youtube.com/watch?v=Ie7vrxY4u3A"
				src="https://www.youtube-nocookie.com/embed/Ie7vrxY4u3A"
			/>

			<table class="timestamps">
				<tbody>{timestamps.map(([at, description]) => <tr>
					<td>
						<a href={`https://www.youtube-nocookie.com/embed/Ie7vrxY4u3A?start=${at}&autoplay=1`} target="intro-video">
							{formatSeconds(at)}
						</a>
					</td>

					<td>{description}</td>
				</tr>)}</tbody>
			</table>
		</Section>

		<Section id="animation">
			<Heading>{t("budgeting_help_page.animation.title")}</Heading>

			<p class="section-paragraph">
				{t("budgeting_help_page.animation.description")}
			</p>

			<Video
				title="Kaasav eelarve koolis animatsioon"
				href="https://www.youtube.com/watch?v=UxUbGb8l3W4"
				src="https://www.youtube-nocookie.com/embed/UxUbGb8l3W4"
			/>
		</Section>

		<Section id="workshop">
			<Heading>{t("budgeting_help_page.workshop.title")}</Heading>

			<p class="section-paragraph">
				{t("budgeting_help_page.workshop.description")}
			</p>

			<ol>
				<li>
					<p class="section-paragraph">
						{Jsx.html(t("budgeting_help_page.workshop.list.1"))}
						{" "}
						<span class="duration">
							{t("budgeting_help_page.workshop.duration", {minutes: 10})}
						</span>
					</p>
				</li>

				<li>
					<p class="section-paragraph">
						{t("budgeting_help_page.workshop.list.2")}
						{" "}
						<span class="duration">
							{t("budgeting_help_page.workshop.duration", {minutes: 10})}
						</span>
					</p>
				</li>

				<li>
					<p class="section-paragraph">
						{t("budgeting_help_page.workshop.list.3")}
						{" "}
						<span class="duration">
							{t("budgeting_help_page.workshop.duration", {minutes: 10})}
						</span>
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
						{t("budgeting_help_page.workshop.list.4")}
						{" "}
						<span class="duration">
							{t("budgeting_help_page.workshop.duration", {minutes: 10})}
						</span>
					</p>

					<Video
						title="Ideest võiduka teostuseni"
						href="https://www.youtube.com/watch?v=rEj3jKt8HxM"
						src="https://www.youtube-nocookie.com/embed/rEj3jKt8HxM"
					/>

				</li>

				<li>
					<p class="section-paragraph">
						{t("budgeting_help_page.workshop.list.5")}
						{" "}
						<span class="duration">
							{t("budgeting_help_page.workshop.duration", {minutes: 8})}
						</span>
					</p>

					<Video
						title="Demokraatias osalemise võimalused ja viisid"
						href="https://www.youtube.com/watch?v=qBZJpzfuaRg"
						src="https://www.youtube-nocookie.com/embed/qBZJpzfuaRg"
					/>
				</li>

				<li>
					<p class="section-paragraph">
						{t("budgeting_help_page.workshop.list.6")}
						{" "}
						<span class="duration">
							{t("budgeting_help_page.workshop.duration", {minutes: 5})}
						</span>
					</p>
				</li>
			</ol>
		</Section>

		<Section id="book">
			<Heading>{t("budgeting_help_page.book.title")}</Heading>

			<p class="section-paragraph">
				{t("budgeting_help_page.book.description")}
			</p>

			<div class="download-links">
				<a
					href="/eelarve/abi/handbook.et.pdf"
					class="green-button"
					download="Kaasav eelarvestamine -- Käsiraamat koolidele (2021).pdf"
				>
					{t("budgeting_help_page.book.download_et")}
				</a>

				<a
					href="/eelarve/abi/handbook.en.pdf"
					class="green-button"
					download="Participatory budgeting -- A handbook for schools (2021).pdf"
				>
					{t("budgeting_help_page.book.download_en")}
				</a>

				<a
					href="/eelarve/abi/handbook.ru.pdf"
					class="green-button"
					download="Народный бюджет -- Справочник для школ (2021).pdf"
				>
					{t("budgeting_help_page.book.download_ru")}
				</a>
			</div>

			<p class="section-paragraph">
				{Jsx.html(t("budgeting_help_page.footer"))}
			</p>

			<div class="supporter-logos">
				<a href="https://acf.ee">
					<img
						src="/assets/acf.svg"
						title="Aktiivsete Kodanike Fond"
						alt="Aktiivsete Kodanike Fond"
					/>
				</a>
				{" "}
				<a href="https://www.norden.ee">
					<img
						src="/assets/norden.svg"
						title="Põhjamaade Ministrite Nõukogu esindus Eestis"
						alt="Põhjamaade Ministrite Nõukogu esindus Eestis"
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

function formatSeconds(seconds) {
	var mins = Math.floor(seconds / 60)
	var secs = seconds % 60
	return mins + ":" + _.padLeft(secs, 2, 0)
}
