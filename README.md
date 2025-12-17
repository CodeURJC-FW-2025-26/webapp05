# **TCG DEVS**

| Name  | Adress | Github |
| :-------------:|:-------------:| :-------------: |
|David Esteban Bernardo|d.estebanb.2022@alumnos.urjc.es|Daviid24x| 
|Mario Aparisi Castro|m.aparisi.2022@alumnos.urjc.es|Aparisi02|
|Izan Gonzalez Cuevas|i.gonzalezcu.2022@alumnos.urjc.es|Izan-Gonzalez-urjc|
|Javier Rodríguez Gil|j.rodriguezgi.2024@alumnos.urjc.es|javrodr19|

## **Functionality**
### Entities
Main Entity: `Pokémon Card`

Main Entity Attributes: 
* `card_name`
* `card_price`
* `card_image`
* `description`
* `illustrator`
* `release_date`
* `collection` (Crown Zenith, Paradox Rift, Black Bolt, 151, Plasma Storm, Legendary Treasures)

Secondary Entity: `Pokémon Card Review`

Secondary Entity Attributes: 
* `nickname`
* `review_date`
* `opinion`
* `rating`

### Images
Each main entity will have a single associated `card_image`.

### Categorization
Each card will be divided according to its `collection_number`.

You can filter each card by `card_name`.


# Práctica 1:








## David Esteban Bernardo
    Realización de la pagina detalle al completo

### Commits más relevantes:

* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/41b2f17e0f8d4aba742ea3f16e7009063b432774
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/6b4e89a22e6a9ef8a96fa81d544d5b490510a6f4
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/3c879dfb045ddb53b7c4ff4bb379c4b898d610fd
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/83ca9342ac780ce52077f835e2c13f2604ef7171
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/9c099b3b0230082155076e362f7b2e4533c7f063

### Ficheros mas trabajados:
    detail.html
    style.css






## Mario Aparisi Castro:
    Realización de la página principal entera (html y css), realización del banner en todas las páginas y ajuste de detalles 
    en la práctica en general
### Commits más relevantes:
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/c62d85c4a18ea42284fc76e8dc04644df8c080f0
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/fedab9defd2c6a098ab6adb4f8123c02c3b4204a
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/bae0d7337d59983b60d5319cc474ea98baee64a4
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/be15aaabb296b51fb174adb3c72ed6f4e3a912e3
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/05002e74cfd5ac2dcd167c10e0f5e41765a6f36e
### Ficheros mas trabajados:
    index.html
    style.css
    imagenes
    
## Izan González Cuevas

	Encargado de la página nuevo elemento en su totalidad, junto con sus estilos css particulares. Traducción de la página a inglés (comentarios en su mayor parte).

### Commits más relevantes:


* Añadido página nuevo elemento con sus consiguientes estilos en el documento css: https://github.com/CodeURJC-FW-2025-26/webapp05/commit/7e1bb76c8117036f79f031954131aa9dbbd34c35

* Pulidos varios en la página nuevo elemento: https://github.com/CodeURJC-FW-2025-26/webapp05/commit/27e4676ff6254a22cf20ece1991da36f1da8bfca

* Pulidos varios en la página nuevo elemento: https://github.com/CodeURJC-FW-2025-26/webapp05/commit/a58be80cf0c7abaefed77e2e602ade94263b3535

* Pulidos varios en la página nuevo elemento: https://github.com/CodeURJC-FW-2025-26/webapp05/commit/079561d397b9175db70ee4a04d7abab115c07aba

* Traducción: https://github.com/CodeURJC-FW-2025-26/webapp05/commit/df214242bc33c7fe13565ff8e51b2fb467bc635b

### Ficheros mas trabajados:

	create new card.html
	styles.css
	pageScreenshots
	index.html
	detail.html


## Javier Rodríguez Gil:
    Realización del footer y los estilos de este.
### Commits más relevantes:
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/86362730d23d355d1fd8b52081b1c77dbcff896c
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/54eda168864a9e527e4a9a526305bd588872c388
### Ficheros mas trabajados:
    index.html
    style.css
    create new card.html










# Práctica 2:


## Vídeo demostrativo

https://youtu.be/AMcx_jbQsIU?si=KtCuLsf1aptRZTSU

## Participación de cada miembro

## David Esteban Bernardo

Encargado de implementar las rutas y la lógica de edición y borrado de la entidad principal: mostrar la página de detalle y el formulario de edición. También mostrar páginas de confirmación tras actualizar/borrar


### Commits más relevantes:

* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/f053d05532bc0a519c8743cd81296fff8f19c765
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/02014165c8144dbe0ee82d7a53cf571870b48612
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/e9db18c31ffda45b3e2397e91924396dc5b55bae

### Ficheros mas trabajados:

    router.js
    board.js 
    edit_post.html
    detail.html

## Mario Aparisi Castro:

Encargado de implementar la página principal y la conexión a la base de datos,
implementé paginación de seis cartas por página y cálculo de páginas totales.
También añadí la búsqueda por nombre y filtros por colección.

### Commits más relevantes:
https://github.com/CodeURJC-FW-2025-26/webapp05/commit/c27c6ce7c2138832f92d2f34fda52a2eca3bcdbf
https://github.com/CodeURJC-FW-2025-26/webapp05/commit/921c32638866bfcbbf5e8631dfc8687972fbe825
https://github.com/CodeURJC-FW-2025-26/webapp05/commit/7bc8d8b7181052ba5d9ddb0dd555980c1f04ea42
https://github.com/CodeURJC-FW-2025-26/webapp05/commit/ce99f42309c65ab6abecfb5f7cff2f41d8a4a32c

### Ficheros mas trabajados:

router.js
board.js
index.html
load_data.js

## Izan González Cuevas

Encargado de adaptar la página de nuevo elemento para actualizarla a los nuevos requerimientos: mostrar su vista, realizar validaciones en frontend, añadir funcionalidad al botón de guardar. Añadir funcionalidad backend al creado de la carta: guardado en el servidor, validación backend.

### Commits más relevantes:

* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/dcdf7eea5b014dd4f1d2914dcad98466a56ac4d0
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/55ef54b406549282de01fd2650dde4daf65c52cd
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/a8ce7b88f2dd36bdb7f805bc6a6a87fa7bfd4657
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/91373d43de3209644e8ccceaddc4448ab94738a5
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/81bf243ccecbf8f13da5383230451ca62b57d08e

### Ficheros mas trabajados:

	create_new_card.html
	router.js
	index.html


## Javier Rodríguez Gil:

Hacer página de error y confirmación, además del trabajo en los respectivos archivos .js pra hacer funcionar ciertas partes.

### Commits más relevantes:

* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/22d1ec18bc9911632763c61b0b10dabc28d179be
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/c4b80095ae10b3cb9697068cba158848393bc51e
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/a7fa8b42a1491dc432b99cda46d539586af1d6a4
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/14a0a4d9e73d42cc235ceae023c85be30ff66713
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/a00caeb0dabd3a5b9ae0b1002afd18aab284b707

### Ficheros mas trabajados:

    router.js
    confirmation.html
    error.html


# Práctica 3:

## Vídeo demostrativo

[url del video aquí]

## Participación de cada miembro

## David Esteban Bernardo

Creación y validación de entidad principal, manejando la lógica de validación compleja y el envío asíncrono.



### Commits más relevantes:
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/77ae3f58e56e1deb469b44f85dab2d52b58ede85
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/20274d7d8349386a791fc8b6b544a52ecfcf5eea
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/ab5f14362eb25a950fac2d973bd8507c47a78474
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/1cfb7414b776826bc060dbc78b7c6d6f32547e87

### Ficheros mas trabajados:
create-card-form.js
create_new_card.html
router.js

## Mario Aparisi Castro:

Encargado de los errores de validación al borrar reseñas y cartas, y hacer el scroll infinito


### Commits más relevantes:
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/a4cf11f109c3de0864bd5db584ab4c6dbd2a40c2
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/562339be41e127ca34d9b727ad6b04c8dc07ab79
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/1b4a05047c32c7241b3b4951d4dfd84976115fc1
### Ficheros mas trabajados:
infinite-scroll.js
index.js
router.js


## Izan González Cuevas

Encargado de la entidad secundaria (las reseñas): formularios con ajax, formulario de edición en la propia reseña, validación front y backend con errores y cuadros de diálogo...

### Commits más relevantes:

* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/29cc5c2d7a9ee21096be34dee64ac79c796d1957
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/717659b18144e68d26d9a84aa85e3a7989bfe25f
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/919449502b6c72d1cc1abf3869549fea00613468
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/e9342d97eec7dce55d7e0cad7b0f97d619904ae8 
* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/d9435ab379c45450c09464787a902d312c96db67

### Ficheros mas trabajados:

    detail.html
    router.js
    board.js

## Javier Rodríguez Gil:

Encargado de lo relacionado con las imágenes (drag & drop, image-upload...).

### Commits más relevantes:

* https://github.com/CodeURJC-FW-2025-26/webapp05/commit/21bed5b3098124a31519a4d2012e70f3a0345243

### Ficheros mas trabajados:

    create-card-form.js
    edit-card-form.js
    image-upload.js