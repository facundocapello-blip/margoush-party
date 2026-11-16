# Prompts de las caras de los malos (Canva generate-image, 4:5)

Estilo común: "Pixar-style 3D cartoon character, full body, side view facing right, mid-walk pose, plain white background, soft studio lighting, glossy stylized render."

- **secuaz**: scruffy skinny street thug, buzz cut, patchy stubble, thick angry eyebrows, crooked smirk, red beanie, dark green bomber jacket, ripped jeans, cardboard box under the arm.
- **patovica**: huge muscular nightclub bouncer, bald, thick neck, black wraparound sunglasses, earpiece, black suit, clipboard with VIP list.
- **bombo**: chubby football-fan drummer, curly black hair, light-blue/white headband and striped shirt, mouth open shouting, big white bass drum.
- **mozo**: snobby thin French waiter, slicked-back grey hair, pointy nose, pencil mustache, vest and bow tie, tray with croissants.
- **delivery**: crazy delivery rider, green helmet with goggles, wild grin, short beard, big square green backpack, running pose.

Fuentes en `tools/sheets_src/<tipo>.png` (160×199, bajas de resolución). Se recortan con
`python3 -I tools/cut_sheet.py tools/sheets_src/<tipo>.png face_<tipo> --frames 1`.
Pendiente: versión de mayor resolución y poses propias (paso, golpe, daño).
