# backstage-plugin-techdocs-backend-module-adp

A hybrid strategy is implemented for techdocs as detailed in the following guide.
<https://backstage.io/docs/features/techdocs/how-to-guides/#how-to-implement-a-hybrid-build-strategy>

Blob storage added as an external data store for documentations. This storage will hold the html documents generate by the build pipeline.

# To refer a documentation within the existing repo use the following approach

[techdocs-local](https://github.com/defra-adp-sandpit/techdocs-local)

- docs

  - index.md

  ```
  Test
  ```

- catalog-info.yaml

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: adp-portal-docs-local
  annotations:
    github.com/project-slug: defra-adp-sandpit/techdocs-local
    backstage.io/techdocs-ref: dir:.
    defra.com/techdocs-builder: local
spec:
  type: documentation
  lifecycle: experimental
  owner: FCP Grants
```

- mkdocs.yml

```yaml
site_name: Test
nav:
  - Introduction: index.md
plugins:
  - techdocs-core
```

# To refer a documentation generated using external pipeline use the following approach

[techdocs-external](https://github.com/defra-adp-sandpit/techdocs-external)

- catalog-info.yaml

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: adp-portal-docs-external
  annotations:
    github.com/project-slug: defra-adp-sandpit/techdocs-external
    backstage.io/techdocs-ref: dir:.

spec:
  type: documentation
  lifecycle: experimental
  owner: FCP Grants
```

# To refer a documentation generated for a different component

[techdocs-crossref](https://github.com/defra-adp-sandpit/techdocs-crossref)

- catalog-info.yaml

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: adp-portal-docs-crossref
  annotations:
    github.com/project-slug: defra-adp-sandpit/techdocs-external
    backstage.io/techdocs-entity: component:default/adp-portal-docs-external

spec:
  type: documentation
  lifecycle: experimental
  owner: FCP Grants
```

The adp backend module for the techdocs plugin.

_This plugin was created through the Backstage CLI_
