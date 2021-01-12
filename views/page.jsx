/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var {Fragment} = Jsx
var LIVERELOAD_PORT = process.env.LIVERELOAD_PORT || 35729
var ENV = process.env.ENV
exports = module.exports = Page
exports.Header = Header
exports.Section = Section
exports.Heading = Heading
exports.Form = Form
exports.DateElement = DateElement

function Page(attrs, children) {
	var req = attrs.req
	var account = req.account
	var session = req.session
	var title = attrs.title
	var page = attrs.page
	var path = (req.baseUrl || "") + req.path

	return <html lang="en" class={attrs.class}>
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width" />
			<link rel="stylesheet" href="/assets/page.css?t=1" type="text/css" />
			<title>{title == null ? "" : title + " - "} Eelarveldaja</title>
			<LiveReload req={req} />
		</head>

		<body id={page + "-page"}>
			<nav id="nav">
				<Centered>
					<a href="/" class="home">Eelarveldaja</a>

					<menu class="pages">
						<a class={prefixed("/schools", path)} href="/schools">Koolid</a>
					</menu>

					<menu class="account">{account ? <Fragment>
						<a class="account-name" href="/account">{account.name}</a>

						<FormButton
							req={req}
							name="_method"
							value="delete"
							class="signout-button"
							action={"/sessions/" + session.id}
						>Logi välja</FormButton>
					</Fragment> : <Fragment>
						<a href="/sessions/new">Logi sisse</a>
					</Fragment>}</menu>
				</Centered>
			</nav>

			<main id="main">{children}</main>

			<footer id="footer">
				<Centered>
					<a href="https://kogu.ee" class="kogu-link">
						<img width="100" src="/assets/kogu.png" alt="Eesti Koostöö Kogu" />
					</a>

					<p>
						Küsimuste või ettepanekute korral võta meiega ühendust aadressil <a
						href="mailto:info@rahvaalgatus.ee">info@rahvaalgatus.ee</a>.
						Eelarveldaja lähtekoodi leiad <a href="https://github.com/rahvaalgatus/eelarveldaja">GitHubist</a>, kus saad ka <a href="https://github.com/rahvaalgatus/eelarveldaja/issues">ettepanekuid teha</a>.
					</p>
				</Centered>
			</footer>
		</body>
	</html>
}

function Centered(_attrs, children) {
	return <div class="centered">{children}</div>
}

function Header(_attrs, children) {
	return <header id="header">
		<Centered>{children}</Centered>
	</header>
}

function Section(attrs, children) {
	return <section
		id={attrs && attrs.id}
		class={"centered " + (attrs && attrs.class || "")}
	>
		{children}
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

function DateElement(attrs) {
	var at = attrs.at
	return <time datetime={at.toJSON()}>{_.formatDate("et", at)}</time>
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

function prefixed(prefix, path) {
	return path == prefix || path.startsWith(prefix + "/") ? "selected" : ""
}
