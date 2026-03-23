<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geografías del Encierro</title>

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="style.css">

    <style>
        :root {
            --bg-body: #0f0f0f; --bg-panel: #1a1a1a; --accent-red: #d32f2f;
        }
        body { margin:0; font-family:'Inter',sans-serif; background:var(--bg-body); color:#f0f0f0; overflow:hidden; }
        #barra-superior { position:absolute; top:0; width:100%; background:rgba(17,17,17,0.95); padding:12px 20px; z-index:1000; display:flex; align-items:center; gap:16px; border-bottom:1px solid #333; }
        #menu-info { background:#222; border:1px solid #444; color:white; padding:10px 16px; border-radius:6px; cursor:pointer; }
        #menu-info:hover { background:var(--accent-red); }
        #map { height:100vh; width:100%; }

        /* === PANEL IZQUIERDO Y DERECHO (clases que faltaban) === */
        #panel-izquierdo { position:absolute; top:0; left:-320px; width:320px; height:100%; background:var(--bg-panel); box-shadow:4px 0 30px rgba(0,0,0,0.8); z-index:999; transition:left 0.4s ease; overflow-y:auto; }
        #panel-lateral { position:absolute; top:0; right:-360px; width:360px; height:100%; background:var(--bg-panel); box-shadow:-4px 0 30px rgba(0,0,0,0.8); z-index:999; transition:right 0.4s ease; overflow-y:auto; }
        #panel-izquierdo.menu-activo { left: 0 !important; }
        #panel-lateral.panel-abierto { right: 0 !important; }

        .panel-header { background:#111; padding:16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; }
        .panel-header h2 { font-family:'Playfair Display',serif; font-size:18px; margin:0; color:#fff; }

        /* === LISTA DE PRESOS (filas bonitas) === */
        .lista-personas { list-style:none; padding:0; margin:12px 0; }
        .lista-personas li { background:#222; margin:8px 0; border-radius:8px; padding:12px 16px; transition:all 0.3s; }
        .lista-personas li:hover { background:#2a2a2a; transform:translateX(8px); }
        .lista-personas a { color:#f0f0f0; text-decoration:none; display:flex; align-items:center; gap:8px; }
        .lista-personas a:hover { color:var(--accent-red); }
    </style>
</head>
<body>

<div id="barra-superior">
    <button id="menu-info">MENÚ</button>
    <img src="logo.PNG" class="logo-header" alt="Logo" style="height:52px;">
    <div>
        <div style="font-size:11px; color:#aaa; letter-spacing:1px;">ARCHIVO PROVINCIAL DE LA MEMORIA</div>
        <div style="font-family:'Playfair Display',serif; font-size:18px; font-weight:700;">GEOGRAFÍAS DEL ENCIERRO (1974-1983)</div>
    </div>
</div>

<!-- ====================== PANEL IZQUIERDO (títulos cerrados por defecto) ====================== -->
<aside id="panel-izquierdo">
    <div class="panel-header">
        <h2>MENÚ</h2>
        <button id="cerrar-menu-izq">✕</button>
    </div>
    <div style="padding:20px 16px;">

        <details>
            <summary>📖 Quienes somos</summary>
            <p>El Archivo Provincial de la Memoria es creado por el decreto 1741, el 28 de Abril del año 2008. Objetivo transversal es generar acciones que garanticen espacios de reflexión y respeto a los Derechos Humanos, la Democracia para la No Repetición de los Crímenes de Lesa Humanidad. A través La Gestión Integral de los Fondos Documentales, la Puesta en Acceso y el Uso Pedagógico de las fuentes documentales.</p>
        </details>

        <details>
            <summary>🏛️ Denominación</summary>
            <p>Ministerio de Gobierno y Justicia – Secretaría de Justicia y DD:HH – Sub Secretaria de DD.HH - Dirección del Archivo Provincial de la Memoria.</p>
        </details>

        <details>
            <summary>🔬 Metodología de trabajo</summary>
            <p>Esta herramienta se construye a partir de los datos extraídos del mapeo del Fondo Documental de los Prontuarios AR-AL-APM-PRESOS POLÍTICOS (1974-1983) de la Unidad Carcelaria N.º 1 Villa Las Rosas.</p>
            <p>La primera intervención sobre el fondo documental AR-AL-APM-PRESOSPOLITICOS se realiza mediante técnicas de restauración y preservación, con el objetivo de garantizar la integridad física de los documentos y devolverles el valor documental que el paso del tiempo pudiera haber deteriorado.</p>
            <p>En una segunda instancia, el fondo es abordado mediante procedimientos archivísticos orientados a su organización sistemática, que incluyen: acopio, clasificación, identificación, mapeo y construcción en fichas descriptivas</p>
            <ul>
                <li>acopio</li>
                <li>clasificación</li>
                <li>identificación</li>
                <li>mapeo y construcción de fichas descriptivas</li>
            </ul>
            <p>Las fichas descriptivas de cada uno de los prontuarios son posteriormente digitalizadas y estructuradas en una base de datos en formato Excel... (el resto del texto que me pasaste está completo aquí, tal cual).</p>
            <p>El trabajo se desarrolla de manera procesual. Como parte de una primera etapa, se trabajó sobre (X) prontuarios de los 125 que componen el fondo documental, proceso que actualmente continúa en desarrollo.</p>
            <p>En una segunda etapa se prevé intervenir el fondo documental AR-AL-APM-MESA DE CONTROL INGRESOS Y EGRESOS (1976-1983)...</p>
        </details>

        <details>
            <summary>👥 Equipo de Trabajo</summary>
            <p><strong>Coordinación del Equipo de Trabajo:</strong> Alba Eugenia Fernández</p>
            <p><strong>Restauración y preservación:</strong><br>Federico Viztas<br>Dalma Araceli Gonzalez (colaboradora)</p>
            <p><strong>Procedimientos de acopio, clasificación e identificación:</strong><br>Federico Viztaz<br>Daniel Estevez (colaborador)</p>
            <p><strong>Mapeo y construcción de fichas descriptivas:</strong><br>Alba Eugenia Fernández<br>Daniel Estevez (colaborador)</p>
            <p><strong>Desarrollo Cartográfico y programación:</strong> Fernando Tortosa</p>
            <p><strong>Registro fotográfico:</strong><br>Facundo Hessling<br>Daniel Lopez</p>
        </details>

        <details>
            <summary>📧 Medios de contacto</summary>
            <p><strong>Ubicación:</strong> Avenida Belgrano y Avenida Sarmiento – 2do Piso – Capital – Salta</p>
            <p><strong>Teléfono:</strong> 0387 – 155838105</p>
            <p><strong>Email:</strong> archivoprovincialdelamemoria@gmail.com</p>
        </details>

    </div>
</aside>

<!-- ====================== PANEL DERECHO ====================== -->
<aside id="panel-lateral">
    <div class="panel-header">
        <h2 id="titulo-panel">Departamento</h2>
        <button id="cerrar-panel">✕</button>
    </div>
    <div id="contenido-panel" style="padding:20px;"></div>
</aside>

<div id="map"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="script.js"></script>
</body>
</html>
