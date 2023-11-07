.table.rows |

(.[0].c | map(.v)) as $header |
($header | index("Identifier")) as $id_column |
($header | index("Estonian")) as $et_column |
($header | index("English")) as $en_column |

.[1:] |

map(.c | {
	key: .[$id_column].v,
	value: {et: .[$et_column].v?, en: .[$en_column].v?}
}) |

map(select(.key | test("\\A\\s*\\Z") | not)) |
from_entries
