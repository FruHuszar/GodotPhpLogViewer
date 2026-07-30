extends Control


func _ready() -> void:
	LogManager.info("Játék elindult a Főjelenetben!")
	LogManager.warning("Ez egy teszt figyelmeztetés!")
	LogManager.error("Ez egy teszt hibaüzenet!")
	
	await get_tree().create_timer(0.1).timeout
	SceneManager.goto_screen(&"main_menu")
