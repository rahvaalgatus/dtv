/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var Paths = require("root/lib/paths")
var {Header} = Page
var {Section} = Page
var {Heading} = Page
var {serializeStyle} = Page
var linkify = require("root/lib/linkify")
exports = module.exports = ReadPage
exports.SchoolPage = SchoolPage
exports.SchoolHeader = SchoolHeader
exports.SchoolButton = SchoolButton

function ReadPage({req, t, school, budgets}) {
	var {roles} = req

	var headerButtonStyle = serializeStyle({
		"border-color": school.foreground_color,
		color: school.foreground_color
	})

	return <SchoolPage page="school" req={req} school={school}>
		<script src="/assets/html5.js" />
		<script src="/assets/hwcrypto.js" />

		<SchoolHeader school={school}>
			<h1>{school.name}</h1>

			{roles.includes("admin") || roles.includes("teacher") ? <menu>
				{roles.includes("teacher") ? <a
					href={Paths.createBudgetPath(school)}
					style={headerButtonStyle}
				>
					{t("school_page.menu.new_budget_button")}
				</a> : null}

				<a href={Paths.updateSchoolPath(school)} style={headerButtonStyle}>
					{t("school_page.menu.update_school_button")}
				</a>
			</menu> : null}
		</SchoolHeader>

		{school.description ? <Section>
			<p id="school-description" class="section-paragraph">
				{Jsx.html(linkify(school.description))}
			</p>
		</Section> : null}

		<Section>
			<Heading>{t("school_page.budgets.title")}</Heading>

			<ul id="budgets">{budgets.map(function(budget) {
				return <li>
					<a href={Paths.budgetPath(school, budget)}>{budget.title}</a>
				</li>
			})}</ul>
		</Section>
	</SchoolPage>
}

function SchoolPage(attrs, children) {
	var {school} = attrs

	return <Page
		class={"school-page " + (attrs.class || "")}
		page={attrs.page}
		req={attrs.req}
		title={(attrs.title ? attrs.title + " - " : "") + school.name}
		headerBackgroundColor={school.background_color}
		headerForegroundColor={school.foreground_color}
	>
		{children}
	</Page>
}

function SchoolHeader(attrs, children) {
	var {school} = attrs
	var schoolPath = Paths.schoolPath(school)

	return <Header
		backgroundColor={school.background_color}
		foregroundColor={school.foreground_color}
	>
		{school.logo_type
			? <img src={schoolPath + "/logo"} class="logo" />
			: null
		}

		{children}
	</Header>
}

function SchoolButton(attrs, children) {
	var {school} = attrs
	var klass = "blue-button " + (attrs.class || "")

	var style = serializeStyle({
		"background-color": school.background_color,
		color: school.foreground_color,

		"border": school.background_color == "#ffffff"
			? "1px solid currentcolor"
			: null
	})

	if (attrs.href) return <a
		href={attrs.href}
		class={klass}
		style={style}
	>
		{children}
	</a>
	else return <button
		type={attrs.type}
		class={klass}
		style={style}
	>
		{children}
	</button>
}
