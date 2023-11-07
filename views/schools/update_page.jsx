/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var Paths = require("root/lib/paths")
var {SchoolPage} = require("./read_page")
var {SchoolHeader} = require("./read_page")
var {SchoolForm} = require("./create_page")
var {Section} = Page
var {Heading} = Page

module.exports = function({req, school, teachers}) {
	var {t} = req
	var schoolPath = Paths.schoolPath(school)

	return <SchoolPage
		page="update-school"
		class="update-school-page"
		req={req}
		school={school}
	>
		<SchoolHeader school={school}>
			<h1><a href={schoolPath}>{school.name}</a></h1>
		</SchoolHeader>

		<Section>
			<SchoolForm req={req} school={school} teachers={teachers} />
		</Section>

		<Section>
			<Heading>{t("update_school_page.teachers.title")}</Heading>

			<p class="section-paragraph">
				{t("update_school_page.teachers.description")}
			</p>

			<table id="teachers" class="budget-table">
				<thead>
					<tr>
						<th>{t("update_school_page.teachers.personal_id_column")}</th>
						<th>{t("update_school_page.teachers.name_column")}</th>
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
