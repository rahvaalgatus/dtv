/** @jsx Jsx */
var Jsx = require("j6pack")
var {javascript} = require("root/lib/jsx")
var SIGNABLE_TYPE = "application/vnd.rahvaalgatus.signable"
module.exports = EidView

var HWCRYPTO_ERRORS = {
	NO_CERTIFICATES: "Lugeja ei leia Id-kaarti või Id-kaart aegunud.",
	NO_IMPLEMENTATION: "Id-kaardi tarkvara või pistikprogramm puudu.",
	NOT_ALLOWED: "Id-kaardi kasutamine pole turvalise ühenduse puudumise tõttu võimalik.",
	TECHNICAL_ERROR: "Tehniline viga.",
	USER_CANCEL: "Katkestasid."
}

function EidView(attrs) {
	var {req} = attrs
	var {formId} = attrs
	var {action} = attrs // "auth" or "sign"
	var {idCardAuthenticationUrl} = attrs
	var {pending} = attrs
	var {submit} = attrs
	var {personalId} = attrs

	return <div class="eid-view">
		<input
			type="radio"
			id="signature-method-tab-id-card"
			name="method"
			value="id-card"
			hidden
		/>

		<input
			type="radio"
			id="signature-method-tab-mobile-id"
			name="method"
			value="mobile-id"
			hidden
		/>

		<input
			type="radio"
			id="signature-method-tab-smart-id"
			name="method"
			value="smart-id"
			hidden
		/>

		<div class="signature-methods">
			{action != "auth" || idCardAuthenticationUrl ? <label
				for="signature-method-tab-id-card"
				class="tab id-card-tab"
			>
				<img
					src="/assets/id-card-title.svg"
					title="Id-kaart"
					alt="Id-kaart"
				/>
			</label> : null}

			<label
				for="signature-method-tab-mobile-id"
				class="tab mobile-id-tab"
			>
				<img
					src="/assets/mobile-id-title.svg"
					title="Mobiil-Id"
					alt="Mobiil-Id"
				/>
			</label>

			<label
				for="signature-method-tab-smart-id"
				class="tab smart-id-tab"
			>
				<img
					src="/assets/smart-id-title.svg"
					title="Smart-Id"
					alt="Smart-Id"
				/>
			</label>
		</div>

		{action != "auth" || idCardAuthenticationUrl ? <fieldset id="id-card-tab">
			<button
				id="id-card-button"
				class="blue-button"
				formaction={action == "auth" ? idCardAuthenticationUrl : null}
			>
				{submit}
			</button>

			<output />
		</fieldset> : null}

		<fieldset id="mobile-id-tab">
			<label>
				<span>Telefoninumber</span>

				<input
					type="tel"
					name="phoneNumber"
					class="budget-input"
				/>
			</label>

			<label>
				<span class="label">Isikukood</span>

				<input
					type="text"
					pattern="[0-9]*"
					inputmode="numeric"
					name="personalId"
					value={personalId}
					class="budget-input"
				/>
			</label>

			<button class="blue-button">
				{submit}
			</button>

			<output>
				<noscript>
					Mobiil-ID kaudu sisselogimine vajab kahjuks JavaScripti.
					Palun lülita see brauseris ajutiselt sisse.
				</noscript>
			</output>
		</fieldset>

		<fieldset id="smart-id-tab">
			<label>
				<span class="label">Isikukood</span>

				<input
					type="text"
					pattern="[0-9]*"
					inputmode="numeric"
					name="personalId"
					value={personalId}
					class="budget-input"
				/>
			</label>

			<button class="blue-button">
				{submit}
			</button>

			<output>
				<noscript>
					Mobiil-ID kaudu sisselogimine vajab kahjuks JavaScripti.
					Palun lülita see brauseris ajutiselt sisse.
				</noscript>
			</output>
		</fieldset>

		<script>{javascript`
			var each = Function.call.bind(Array.prototype.forEach)
			var form = document.getElementById(${formId})

			form.addEventListener("submit", function(ev) {
				var tab = ev.target.elements.method.value
				if (tab == "id-card") return

				ev.preventDefault()
				document.getElementById(tab + "-tab").querySelector("button").click()
			})

			var inputs = [
				document.querySelector("#mobile-id-tab input[name=personalId]"),
				document.querySelector("#smart-id-tab input[name=personalId]")
			]

			inputs.forEach(function(from) {
				from.addEventListener("change", function(ev) {
					each(inputs, function(to) {
						if (to != from) to.value = ev.target.value
					})
				})
			})	
		`}</script>

		<script>{javascript`
			var reduce = Function.call.bind(Array.prototype.reduce)
			var encode = encodeURIComponent

			if (${action == "sign"}) (function() {
				var Hwcrypto = require("@kaasavkool/hwcrypto")
				var tab = document.getElementById("id-card-tab")
				var button = tab.querySelector("button")
				var output = tab.querySelector("output")
				var all = Promise.all.bind(Promise)

				button.addEventListener("click", function(ev) {
					ev.preventDefault()

					notice(${pending})

					var form = ev.target.form

					var certificate = Hwcrypto.certificate(${action}).catch(function(err) {
						if (err.message != "invalid_argument") throw err

						// ID-software bugs out if you immediately ask for a new
						// certificate.
						return delay(1).then(Hwcrypto.certificate.bind(null, "sign"))
					})

					var obj = serializeForm(form)
					delete obj._csrf_token
					delete obj.phoneNumber
					delete obj.method
					delete obj.personalId

					var signable = certificate.then(function(certificate) {
						return fetch(form.action + "?" + serializeQuery(obj), {
							method: "POST",
							credentials: "same-origin",

							headers: {
								"X-CSRF-Token": ${req.csrfToken},
								"Content-Type": "application/pkix-cert",
								Accept: ${SIGNABLE_TYPE}
							},

							body: certificate.toDer()
						}).then(assertOk).then(function(res) {
							return res.arrayBuffer().then(function(signable) {
								return [res.headers.get("location"), new Uint8Array(signable)]
							})
						})
					})

					var signature = all([certificate, signable]).then(function(all) {
						var certificate = all[0]
						var signable = all[1][1]
						return Hwcrypto.sign(certificate, "SHA-256", signable)
					})

					var done = all([signable, signature]).then(function(all) {
						var url = all[0][0]
						var signature = all[1]

						return fetch(url, {
							method: "POST",
							credentials: "same-origin",

							headers: {
								"X-CSRF-Token": ${req.csrfToken},
								"Content-Type": "application/vnd.rahvaalgatus.signature",
								Accept: "application/json"
							},

							body: signature
						}).then(assertOk).then(function(res) {
							return res.json().then(function(obj) {
								notice(obj.description || obj.message)

								if (obj.code == "OK" && obj.location) {
									window.location.assign(obj.location)
								}
							})
						})
					})

					done.catch(noticeError)
					done.catch(raise)
				})

				function noticeError(err) {
					notice(
						err.code && ${HWCRYPTO_ERRORS}[err.code] ||
						err.description ||
						err.message
					)
				}

				function notice(msg) { output.textContent = msg }
				function raise(err) { setTimeout(function() { throw err }) }
			})()

			;[
				document.querySelector("#mobile-id-tab button"),
				document.querySelector("#smart-id-tab button")
			].forEach(function(tab) {
				tab.addEventListener("click", handleMobileSubmit)
			})

			function handleMobileSubmit(ev) {
				ev.preventDefault()

				var button = ev.target
				var form = button.form
				var output = button.parentNode.querySelector("output")
				function notice(msg) { output.textContent = msg || "" }

				notice(${pending})

				fetch(form.action, {
					method: "POST",
					credentials: "same-origin",

          headers: {
            "Content-Type": "application/json",
						Accept: "application/json"
          },

          body: JSON.stringify(serializeForm(form))
        }).then(assertOk).then(function(res) {
          var code = res.headers.get("X-Verification-Code")
          notice("Kinnituskood: " + code)

          return res.json().then(function(obj) {
						notice(obj.description || obj.message)

						if (obj.code == "OK" && obj.location) {
							window.location.assign(obj.location)
						}
          })
        }).catch(function(err) {
          notice(err.description || err.message)
        })
			}

			function serializeForm(form) {
				return reduce(form.elements, function(obj, el) {
					if (!(el.tagName == "INPUT")) return obj
					if (el.type == "radio" && !el.checked) return obj
					if (el.type == "checkbox" && !el.checked) return obj

					obj[el.name] = el.value
					return obj
				}, {})
			}

      function serializeQuery(obj) {
        var parts = []
        for (var key in obj) parts.push(key + "=" + encode(obj[key]))
        return parts.join("&")
      }

      function assertOk(res) {
        if (res.ok) return res

        var err = new Error(res.statusText)
        err.code = res.status

				var type = res.headers.get("content-type")

				if (/^application\\/json(;|$)/.test(type))
					return res.json().then(function(body) {
						err.message = body.message
						err.description = body.description
						throw err
					})
        else throw err
      }

			function delay(seconds) {
				return new Promise(function(resolve) {
					setTimeout(resolve, seconds * 1000)
				})
			}
		`}</script>
	</div>
}
