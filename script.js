document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. VARIABLES GLOBALES Y ESTADO
    // ==========================================
    let fotosGuardadas = JSON.parse(localStorage.getItem('fotosMartha')) || [];
    let comentariosGlobales = JSON.parse(localStorage.getItem('comentariosMartha')) || {};
    let urlFotoActual = '';
    let filtroActual = 'destacados';
    let accionPendiente = null;

    // ==========================================
    // 2. PANTALLA DE BIENVENIDA
    // ==========================================
    const pantallaBienvenida = document.getElementById('pantalla-bienvenida');
    const appPrincipal = document.getElementById('app-principal');
    document.getElementById('btn-ingresar').addEventListener('click', () => {
        pantallaBienvenida.style.opacity = '0';
        setTimeout(() => {
            pantallaBienvenida.classList.add('oculto');
            appPrincipal.classList.remove('oculto');
            cargarGaleria();
        }, 1000);
    });

    // ==========================================
    // 2.5. FONDO PERSONALIZABLE
    // ==========================================
    const inputFondo = document.getElementById('input-fondo');
    
    // Cargar fondo guardado al iniciar
    const fondoGuardado = localStorage.getItem('fondoGaleria');
    if (fondoGuardado) {
        document.body.style.backgroundImage = `url(${fondoGuardado})`;
    }

    inputFondo.addEventListener('change', (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const fondoBase64 = event.target.result;
            document.body.style.backgroundImage = `url(${fondoBase64})`;
            try {
                localStorage.setItem('fondoGaleria', fondoBase64);
            } catch (error) {
                alert("La imagen es muy pesada para guardarla. Intenta con una más ligera.");
            }
        };
        reader.readAsDataURL(archivo);
        inputFondo.value = '';
    });

    // ==========================================
    // 3. LÓGICA DEL MENÚ (FILTROS)
    // ==========================================
    const botonesFiltro = document.querySelectorAll('.filtro-btn');
    botonesFiltro.forEach(btn => {
        btn.addEventListener('click', (e) => {
            botonesFiltro.forEach(b => b.classList.remove('activo'));
            e.target.classList.add('activo');
            filtroActual = e.target.dataset.filtro;
            cargarGaleria();
        });
    });

    function cargarGaleria() {
        const galeria = document.getElementById('galeria');
        galeria.innerHTML = '';
        const fotosFiltradas = fotosGuardadas.filter(foto => foto.categoria === filtroActual);
        fotosFiltradas.forEach(foto => {
            agregarFotoAlDOM(foto.url, foto.categoria);
        });
    }

    // ==========================================
    // 4. SUBIR FOTOS
    // ==========================================
    const inputFoto = document.getElementById('input-foto');
    const selectorCategoria = document.getElementById('categoria-subida');

    inputFoto.addEventListener('change', (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        const categoria = selectorCategoria.value;

        const reader = new FileReader();
        reader.onload = (event) => {
            const nuevaFoto = { url: event.target.result, categoria: categoria };
            fotosGuardadas.push(nuevaFoto);
            try {
                localStorage.setItem('fotosMartha', JSON.stringify(fotosGuardadas));
                cargarGaleria();
            } catch (error) {
                alert("El navegador se quedó sin espacio. Intenta subir fotos más pequeñas o borrar algunas.");
            }
        };
        reader.readAsDataURL(archivo);
        inputFoto.value = ''; 
    });

    function agregarFotoAlDOM(url, categoria) {
        const galeria = document.getElementById('galeria');
        const div = document.createElement('div');
        div.className = 'foto-item';
        
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Foto';
        img.addEventListener('click', () => abrirModal(url));
        
        const btnBorrar = document.createElement('button');
        btnBorrar.className = 'btn-borrar-foto';
        btnBorrar.innerHTML = '&times;';
        btnBorrar.title = 'Eliminar foto';
        btnBorrar.addEventListener('click', (e) => {
            e.stopPropagation();
            pedirConfirmacion('¿Eliminar esta foto permanentemente?', 'foto', { url, elementoDOM: div });
        });

        div.appendChild(img);
        div.appendChild(btnBorrar);
        galeria.appendChild(div);
    }

    // ==========================================
    // 5. MODAL PRINCIPAL (FOTO Y COMENTARIOS)
    // ==========================================
    const modalFoto = document.getElementById('modal-foto');
    const imgGrande = document.getElementById('img-grande');
    const tarjetaFoto = document.getElementById('tarjeta-foto');
    const modalContenido = document.getElementById('modal-contenido-tarjeta');
    const listaComentarios = document.getElementById('lista-comentarios');
    const nuevoComentario = document.getElementById('nuevo-comentario');

    function abrirModal(url) {
        urlFotoActual = url;
        imgGrande.src = url;
        
        imgGrande.onload = () => {
            const ancho = imgGrande.naturalWidth;
            const alto = imgGrande.naturalHeight;
            const maxAncho = window.innerWidth * 0.8;
            const maxAlto = window.innerHeight * 0.8;
            let escala = 1;
            if (ancho > maxAncho || alto > maxAlto) {
                escala = Math.min(maxAncho / ancho, maxAlto / alto);
            }
            const anchoFinal = ancho * escala;
            const altoFinal = alto * escala;
            
            modalContenido.style.width = `${anchoFinal}px`;
            modalContenido.style.height = `${altoFinal}px`;
            tarjetaFoto.style.width = `${anchoFinal}px`;
            tarjetaFoto.style.height = `${altoFinal}px`;
        };

        modalFoto.classList.remove('oculto');
        tarjetaFoto.classList.remove('volteada');
        cargarComentarios(url);
    }

    document.getElementById('cerrar-modal').addEventListener('click', () => modalFoto.classList.add('oculto'));
    tarjetaFoto.addEventListener('dblclick', () => tarjetaFoto.classList.toggle('volteada'));

    // ==========================================
    // 6. COMENTARIOS
    // ==========================================
    function cargarComentarios(url) {
        listaComentarios.innerHTML = '';
        const comentariosFoto = comentariosGlobales[url] || [];
        
        comentariosFoto.forEach((texto, index) => {
            const div = document.createElement('div');
            div.className = 'comentario-item';
            const p = document.createElement('p');
            p.textContent = texto;
            const acciones = document.createElement('div');
            acciones.className = 'acciones-comentario';
            
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-editar';
            btnEditar.innerHTML = '🖋';
            btnEditar.onclick = () => abrirModalEditar(url, index, texto);
            
            const btnBorrar = document.createElement('button');
            btnBorrar.className = 'btn-borrar-comentario';
            btnBorrar.innerHTML = '🗑';
            btnBorrar.onclick = () => pedirConfirmacion('¿Borrar esta dedicatoria?', 'comentario', { url, index });
            
            acciones.appendChild(btnEditar);
            acciones.appendChild(btnBorrar);
            div.appendChild(p);
            div.appendChild(acciones);
            listaComentarios.appendChild(div);
        });
    }

    document.getElementById('btn-guardar-comentario').addEventListener('click', () => {
        const texto = nuevoComentario.value.trim();
        if (!texto) return;
        if (!comentariosGlobales[urlFotoActual]) comentariosGlobales[urlFotoActual] = [];
        comentariosGlobales[urlFotoActual].push(texto);
        localStorage.setItem('comentariosMartha', JSON.stringify(comentariosGlobales));
        nuevoComentario.value = '';
        cargarComentarios(urlFotoActual);
    });

    // ==========================================
    // 7. MODALES PERSONALIZADOS
    // ==========================================
    const modalConfirmar = document.getElementById('modal-confirmar');
    const textoConfirmar = document.getElementById('texto-confirmar');
    const modalEditar = document.getElementById('modal-editar');
    const inputEditar = document.getElementById('input-editar-comentario');

    function pedirConfirmacion(mensaje, tipo, datos) {
        textoConfirmar.textContent = mensaje;
        accionPendiente = { tipo, datos };
        modalConfirmar.classList.remove('oculto');
    }

    document.getElementById('btn-cancelar-accion').addEventListener('click', () => {
        modalConfirmar.classList.add('oculto');
        accionPendiente = null;
    });

    document.getElementById('btn-aceptar-accion').addEventListener('click', () => {
        if (!accionPendiente) return;
        if (accionPendiente.tipo === 'foto') {
            eliminarFoto(accionPendiente.datos.url, accionPendiente.datos.elementoDOM);
        } else if (accionPendiente.tipo === 'comentario') {
            borrarComentario(accionPendiente.datos.url, accionPendiente.datos.index);
        }
        modalConfirmar.classList.add('oculto');
        accionPendiente = null;
    });

    function abrirModalEditar(url, index, textoActual) {
        inputEditar.value = textoActual;
        accionPendiente = { tipo: 'editar', datos: { url, index } };
        modalEditar.classList.remove('oculto');
    }

    document.getElementById('btn-cancelar-editar').addEventListener('click', () => {
        modalEditar.classList.add('oculto');
        accionPendiente = null;
    });

    document.getElementById('btn-guardar-editar').addEventListener('click', () => {
        if (!accionPendiente || accionPendiente.tipo !== 'editar') return;
        const nuevoTexto = inputEditar.value.trim();
        if (nuevoTexto) {
            const { url, index } = accionPendiente.datos;
            comentariosGlobales[url][index] = nuevoTexto;
            localStorage.setItem('comentariosMartha', JSON.stringify(comentariosGlobales));
            cargarComentarios(url);
        }
        modalEditar.classList.add('oculto');
        accionPendiente = null;
    });

    // ==========================================
    // 8. FUNCIONES DE ELIMINACIÓN
    // ==========================================
    function eliminarFoto(url, elementoDOM) {
        elementoDOM.remove();
        fotosGuardadas = fotosGuardadas.filter(foto => foto.url !== url);
        localStorage.setItem('fotosMartha', JSON.stringify(fotosGuardadas));
        delete comentariosGlobales[url];
        localStorage.setItem('comentariosMartha', JSON.stringify(comentariosGlobales));
    }

    function borrarComentario(url, index) {
        comentariosGlobales[url].splice(index, 1);
        localStorage.setItem('comentariosMartha', JSON.stringify(comentariosGlobales));
        cargarComentarios(url);
    }

    // ==========================================
    // 9. REPRODUCTOR DE MÚSICA
    // ==========================================
    const selectorCancion = document.getElementById('selector-cancion');
    const audioPlayer = document.getElementById('audio-player');

    audioPlayer.src = `cancion1.mp3`;
    audioPlayer.load();

    selectorCancion.addEventListener('change', (e) => {
        audioPlayer.src = `${e.target.value}`;
        audioPlayer.load(); 
        audioPlayer.play().catch(error => {
            console.log("Haz clic en Play para reproducir.");
        });
    });
});