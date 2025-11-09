{{/*
Expand the name of the chart.
*/}}
{{- define "linktree.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "linktree.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "linktree.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "linktree.labels" -}}
helm.sh/chart: {{ include "linktree.chart" . }}
{{ include "linktree.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "linktree.selectorLabels" -}}
app.kubernetes.io/name: {{ include "linktree.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Backend labels
*/}}
{{- define "linktree.backend.labels" -}}
{{ include "linktree.labels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "linktree.backend.selectorLabels" -}}
{{ include "linktree.selectorLabels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "linktree.frontend.labels" -}}
{{ include "linktree.labels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "linktree.frontend.selectorLabels" -}}
{{ include "linktree.selectorLabels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Database name
*/}}
{{- define "linktree.database.name" -}}
{{- if .Values.database.external }}
{{- .Values.database.host }}
{{- else }}
{{- printf "%s-postgresql" (include "linktree.fullname" .) }}
{{- end }}
{{- end }}
