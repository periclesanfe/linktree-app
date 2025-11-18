{{/*
======================
BACKEND HELPERS
======================
*/}}

{{/*
Expand the name of the backend.
*/}}
{{- define "linktree.backend.name" -}}
{{- default "linktree-backend" .Values.backend.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name for backend.
*/}}
{{- define "linktree.backend.fullname" -}}
{{- if .Values.backend.fullnameOverride }}
{{- .Values.backend.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "linktree-backend" .Values.backend.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label for backend.
*/}}
{{- define "linktree.backend.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels for backend
*/}}
{{- define "linktree.backend.labels" -}}
helm.sh/chart: {{ include "linktree.backend.chart" . }}
{{ include "linktree.backend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: linktree
app.kubernetes.io/component: backend
environment: {{ .Values.environment }}
{{- end }}

{{/*
Selector labels for backend
*/}}
{{- define "linktree.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "linktree.backend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
======================
FRONTEND HELPERS
======================
*/}}

{{/*
Expand the name of the frontend.
*/}}
{{- define "linktree.frontend.name" -}}
{{- default "linktree-frontend" .Values.frontend.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name for frontend.
*/}}
{{- define "linktree.frontend.fullname" -}}
{{- if .Values.frontend.fullnameOverride }}
{{- .Values.frontend.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default "linktree-frontend" .Values.frontend.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label for frontend.
*/}}
{{- define "linktree.frontend.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels for frontend
*/}}
{{- define "linktree.frontend.labels" -}}
helm.sh/chart: {{ include "linktree.frontend.chart" . }}
{{ include "linktree.frontend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: linktree
app.kubernetes.io/component: frontend
environment: {{ .Values.environment }}
{{- end }}

{{/*
Selector labels for frontend
*/}}
{{- define "linktree.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "linktree.frontend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
