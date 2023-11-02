This dataset contains a small corpus of SHACL shapes (raw-* directories)
which were downloaded using the NodeJS script get-content.js and the config files of the download-config directory.

Using montolo (https://w3id.org/montolo) and a ptyhon script (https://zenodo.org/record/2165747)
constraint use statistics were generated (stats-* directories).
These statistics are described in RDF following the montolo vocabulary (https://zenodo.org/record/3343335).

In case a turtle file from GitHub or the web in general had a syntax error,
the file was dowloaded manually, i.e. file-local key of the download-config.

The directory structure looks as follows (created with the bash command "tree"):
.
├── download-config
│   ├── curated-shapes.json
│   ├── oslo-shapes.json
│   └── schema-shapes.json
├── get-content.js
├── raw-curated
│   ├── aksw-sh.nt
│   ├── bds.nt
│   ├── dcat-ap.nt
│   ├── dcat-de.nt
│   ├── dcat-ech.nt
│   ├── eli-sh.nt
│   ├── eudm.nt
│   ├── fair.nt
│   ├── fsgim.nt
│   ├── geo.nt
│   ├── geovalidator.nt
│   ├── hiphop.nt
│   ├── oash.nt
│   ├── periodo.nt
│   ├── scolomfr-sh.nt
│   ├── shsh.nt
│   ├── tern.nt
│   ├── uwl.nt
│   └── wasa.nt
├── raw-oslo
│   └── oslo.nt
├── raw-schemash
│   └── schemash.nt
├── README.txt
├── stats-curated
│   ├── aksw-sh-stats.ttl
│   ├── bds-stats.ttl
│   ├── dcat-ap-stats.ttl
│   ├── dcat-de-stats.ttl
│   ├── dcat-ech-stats.ttl
│   ├── eli-sh-stats.ttl
│   ├── eudm-stats.ttl
│   ├── fair-stats.ttl
│   ├── fsgim-stats.ttl
│   ├── geo-stats.ttl
│   ├── geovalidator-stats.ttl
│   ├── hiphop-stats.ttl
│   ├── oash-stats.ttl
│   ├── periodo-stats.ttl
│   ├── scolomfr-sh-stats.ttl
│   ├── shsh-stats.ttl
│   ├── tern-stats.ttl
│   ├── uwl-stats.ttl
│   └── wasa-stats.ttl
├── stats-oslo
│   └── oslo-stats.ttl
└── stats-schemash
    └── schemash-stats.ttl

7 directories, 47 files
