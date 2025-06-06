/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Fs = require("fs")
var Path = require("path")
var Jsx = require("j6pack")
var LIVERELOAD_PORT = process.env.LIVERELOAD_PORT || 35729
var ENV = process.env.ENV
exports = module.exports = Page
exports.Header = Header
exports.Section = Section
exports.Centered = Centered
exports.Heading = Heading
exports.Form = Form
exports.DateElement = DateElement
exports.serializeStyle = serializeStyle
var ASSETS_PATH = Path.dirname(require.resolve("../public/assets/logo.svg"))
var LOGO_SVG = Fs.readFileSync(ASSETS_PATH + "/logo.svg")
var KOGU_LOGO_SVG = Fs.readFileSync(ASSETS_PATH + "/kogu.svg")

function Page(attrs, children) {
	var req = attrs.req
	var {l10n} = req
	var {t} = req
	var {account} = req
	var {session} = req
	var {title} = attrs
	var {page} = attrs
	var {homeless} = attrs

	var headerStyle = serializeStyle({
		"background-color": attrs.headerBackgroundColor,
		color: attrs.headerForegroundColor
	})

	return <html lang={l10n.language}>
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width" />
			<link rel="stylesheet" href="/assets/page.css?t=1" type="text/css" />
			<title>{title == null ? "" : title + " - "} {t("title")}</title>
			<LiveReload req={req} />
		</head>

		<body id={page + "-page"} class={attrs.class}>
			<nav id="nav" style={headerStyle}>
				<Centered>
					{!homeless ? <a href="/" class="home" title={t("nav.home")}>
						{Jsx.html(LOGO_SVG)}
					</a> : null}

					<menu class="account-menu">
						{account ? <>
							<a class="account-name" href="/account">{account.name}</a>

							<FormButton
								req={req}
								name="_method"
								value="delete"
								class="signout-button"
								action={"/sessions/" + session.id}
							>{t("nav.sign_out")}</FormButton>
						</> : <>
							<a href="/sessions/new" class="signin-button">
								{t("nav.sign_in")}
							</a>
						</>}

						<Form
							id="language-form"
							req={req}
							method="put"
							action="/language"
						>{_.map({
							et: "Eesti keeles",
							en: "In English"
						}, (title, lang) => <button
							name="language"
							value={lang}
							disabled={l10n.language == lang}
						>
							<img
								src={`/assets/${lang}.svg`}
								alt={title}
								title={title}
							/>
						</button>)}</Form>
					</menu>
				</Centered>
			</nav>

			<main id="main">{children}</main>

			<footer id="footer" style={headerStyle}>
				<Centered>
					<div class="logos">
						<a href="https://kogu.ee" title="Eesti Koostöö Kogu">
							{Jsx.html(KOGU_LOGO_SVG)}
						</a>

						<a href="https://transparency.ee" title="Korruptsioonivaba Eesti">
							<img
								width="100"
								src="/assets/transparency-international.png"
								alt="Korruptsioonivaba Eesti"
							/>
						</a>
					</div>

					<p>{Jsx.html(t("footer.contacts"))}</p>
				</Centered>
			</footer>
		</body>
	</html>
}

function Centered(_attrs, children) {
	return <div class="centered">{children}</div>
}

function Header(attrs, children) {
	var style = attrs && serializeStyle({
		"background-color": attrs.backgroundColor,
		color: attrs.foregroundColor
	})

	return <header id="header" style={style}>
		<Centered>{children}</Centered>
	</header>
}

function Section(attrs, children) {
	var {wide} = attrs || Object

	return <section
		id={attrs && attrs.id}
		class={(wide ? "" : "centered ") + (attrs && attrs.class || "")}
	>
		{wide ? <Centered>{children}</Centered> : children}
	</section>
}

function Heading(_attrs, children) {
	return <h2 class="section-heading">{children}</h2>
}

function Form(attrs, children) {
	var method = attrs.method

	return <form
		id={attrs.id}
		class={attrs.class}
		action={attrs.action}
		hidden={attrs.hidden}
		enctype={attrs.enctype}
		method={method == "get" ? method : "post"}
	>
		{method && !(method == "get" || method == "post") ?
			<input type="hidden" name="_method" value={method} />
		: null}

		{method != "get" ?
			<input type="hidden" name="_csrf_token" value={attrs.req.csrfToken} />
		: null}

		{children}
	</form>
}

function FormButton(attrs, children) {
	return <Form
		req={attrs.req}
		action={attrs.action}
		enctype={attrs.enctype}
		method={attrs.name == "_method" ? "post" : "put"}
	>
		<button
			id={attrs.id}
			class={attrs.class}
			type={attrs.type}
			name={attrs.name}
			value={attrs.value}
			onclick={attrs.onclick}
			disabled={attrs.disabled}
		>{children}</button>
	</Form>
}

function DateElement({l10n, at}) {
	return <time datetime={at.toJSON()}>{l10n.formatDate(at)}</time>
}

function LiveReload(attrs) {
	if (ENV != "development") return null
	var req = attrs.req

	return <script
		src={`http://${req.hostname}:${LIVERELOAD_PORT}/livereload.js?snipver=1`}
		async
		defer
	/>
}

function serializeStyle(styles) {
	return _.map(styles, (value, key) => (
		value ? key + ": " + value : null
	)).filter(Boolean).join("; ")
}
