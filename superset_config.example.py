# superset_config.py
import logging
#from cachelib.redis import RedisCache
from flask import Response
from flask_appbuilder.security.manager import AUTH_DB

logger = logging.getLogger(__name__)
ASSETS_FOLDER = "/home/rbh/custom_assets" 

AUTH_TYPE = AUTH_DB
SECRET_KEY = "CHANGE_ME"
FEATURE_FLAGS = {
	"EMBEDDED_SUPERSET": True,
        "EMBEDDABLE_CHARTS": True,
	"ENABLE_TEMPLATE_PROCESSING": True,
	"ENABLE_EXTENSIONS": True,
        "HORIZONTAL_FILTER_BAR": True,
        "DASHBOARD_NATIVE_FILTERS_SET": True,
        "DASHBOARD_NATIVE_FILTERS": True,
        "DRILL_BY": True,
        "DRILL_TO_DETAIL": True,
        "DASHBOARD_CROSS_FILTERS": True,
	"DASHBOARD_FILTERS_EXPERIMENTAL": True 
}
ENABLE_CORS = True
CORS_OPTIONS = {
        "supports_credentials": True,
	"origins": ["*"]
}
PUBLIC_ROLE_LIKE = "Gamma"
ENABLE_PROXY_FIX = True
HTTP_HEADERS = {
  "X-Frame-Options": "ALLOWALL"
}
TALISMAN_ENABLED = False
TALISMAN_CONFIG = {
  "content_security_policy": {
    "frame-ancestors": [
       "self",
       "https://10.11.50.5:5001"
    ]
  }
}
WTF_CSRF_ENABLED = False
SUPERSET_WEBSERVER_TIMEOUT = 300
PREVENT_UNSAFE_DB_CONNECTIONS = False
ADDITIONAL_DATABASE_ALLOWED_NAMES = ["shillelagh"]
SQLALCHEMY_ENGINE_OPTIONS = {
	"pool_recycle": 1800,
	"pool_pre_ping": True
}
SAMPLES_ROW_LIMIT = 100000
HTML_SANITIZATION = True
HTML_SANITIZATION_SCHEMA_EXTENSIONS = {
    "tagNames": ["style", "table", "thead", "tbody", "tr", "th", "td",
                 "svg", "g", "polygon", "circle", "line", "text", "rect", "title"],
    "attributes": {
        "*": ["style", "class", "className", "id", "data*"],
        "td": ["style", "class", "className", "data*", "colspan", "rowspan"],
        "th": ["style", "class", "className", "data*", "colspan", "rowspan"],
        "tr": ["style", "class", "className", "data*"],
        "div": ["style", "class", "className", "data*"],
        "span": ["style", "class", "className", "data*"],
        "table": ["style", "class", "className"],
        "svg": ["viewBox", "xmlns", "width", "height"],
        "g": ["transform", "fill", "stroke"],
        "polygon": ["points", "fill", "stroke", "stroke-width"],
        "circle": ["cx", "cy", "r", "fill", "stroke", "stroke-width"],
        "line": ["x1", "y1", "x2", "y2", "stroke", "stroke-width"],
        "text": ["x", "y", "font-size", "text-anchor", "fill"],
        "rect": ["x", "y", "width", "height", "fill", "stroke"],
    },
}
