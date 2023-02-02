/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var Paths = require("root/lib/paths")
var {SchoolPage} = require("./read_page")
var {SchoolHeader} = require("./read_page")
var {SchoolForm} = require("./create_page")
var {Section} = Page
var {Heading} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {school} = attrs
	var {teachers} = attrs
	var schoolPath = Paths.schoolPath(school)

	return <SchoolPage
		page="update-school"
		class="update-school-page"
		req={attrs.req}
		school={school}
	>
		<SchoolHeader school={school}>
			<h1><a href={schoolPath}>{school.name}</a></h1>
		</SchoolHeader>

		<Section>
			<SchoolForm req={req} school={school} teachers={teachers} />
		</Section>

		<Section>
			<Heading>Õpetajad</Heading>

			<p class="section-paragraph">
				Õpetajatel on õigus muuta kooli nime ja loetelu õpilastest, kes on
				lubatud esitama ideid või nende poolt hääletada. Õpetajad saavad ka
				alati lisada ideid. Õpetajate lisamiseks palun võta meiega ühendust.
			</p>

			<table id="teachers" class="budget-table">
				<thead>
					<tr>
						<th>Isikukood</th>
						<th>Nimi</th>
					</tr>
				</thead>

				<tbody>{teachers.map(function(teacher) {
					return <tr>
						<td>{teacher.personal_id}</td>
						<td>{teacher.name}</td>
					</tr>
				})}</tbody>
			</table>
		</Section>
	</SchoolPage>
}
