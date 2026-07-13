package main

import (
	"io"
	"context"
	"embed"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed frontend/templates
var templatesFS embed.FS

type App struct {
	ctx context.Context
	projectPath string // <-- DODANE
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	runtime.LogInfo(a.ctx, "[APP] Janusz Wails wystartował")
}

// SETTER/GETTER dla projectPath
func (a *App) SetProjectPath(path string) {
	a.projectPath = path
	runtime.LogInfo(a.ctx, "[APP] Ustawiono projectPath: "+path)
}

func (a *App) GetProjectPath() string {
	return a.projectPath
}

// DIALOG - WYBÓR FOLDERU
func (a *App) SelectFolder() (string, error) {
	runtime.LogInfo(a.ctx, "[APP] Otwieram dialog wyboru folderu")
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Wybierz folder projektu",
	})
}

// DOMYŚLNA ŚCIEŻKA DO DOKUMENTÓW
func (a *App) GetDefaultProjectPath() string {
	home, _ := os.UserHomeDir()
	defaultPath := filepath.Join(home, "Documents", "JanuszProjects")
	runtime.LogInfo(a.ctx, "[APP] Domyślna ścieżka: "+defaultPath)
	return defaultPath
}

// TWORZENIE PROJEKTU - POPRAWIONA WERSJA
func (a *App) CreateProject(fullPath string, gameName string) error {
	runtime.LogInfo(a.ctx, "[APP] Tworzę projekt: "+fullPath)
	a.SetProjectPath(fullPath) // <-- USTAW PATH

	// 1. Foldery
	dirs := []string{
		filepath.Join(fullPath, "Data"),
		filepath.Join(fullPath, "GameImages"),
		filepath.Join(fullPath, "sounds"),
	}
	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err!= nil {
			runtime.LogError(a.ctx, "[APP] Błąd mkdir: "+err.Error())
			return err
		}
	}

	// 2. project.janproj
	meta := map[string]interface{}{
		"gameName": gameName,
		"author": "",
		"version": "1.0.0",
		"engineVersion": "2.0.0",
		"startDay": "day1",
		"startScene": "start",
	}
	metaBytes, _ := json.MarshalIndent(meta, "", " ")
	if err := os.WriteFile(filepath.Join(fullPath, "project.janproj"), metaBytes, 0644); err!= nil {
		runtime.LogError(a.ctx, "[APP] Błąd zapisu meta: "+err.Error())
		return err
	}

	// 3. day1.json
	day1 := []map[string]interface{}{
		{
			"Id": "start",
			"SceneTitle": "Początek",
			"Background": "images/bg_tutorial.jpg",
			"Text": "Witaj w Edytorze Janusza. To jest pierwsza scena Twojej gry. Kliknij Instrukcja Obsługi w menu głównym.",
			"Choices": []interface{}{},
		},
	}
	day1Bytes, _ := json.MarshalIndent(day1, "", " ")
	if err := os.WriteFile(filepath.Join(fullPath, "Data", "day1.json"), day1Bytes, 0644); err!= nil {
		return err
	}

	// 4. DEBUG: Sprawdź co embed widzi
	entries, err := fs.ReadDir(templatesFS, "frontend/templates/Assets")
	if err!= nil {
		runtime.LogError(a.ctx, "[APP] Błąd odczytu embed: "+err.Error())
	} else {
		runtime.LogInfo(a.ctx, fmt.Sprintf("[APP] Embed widzi %d plików w Assets", len(entries)))
		for _, e := range entries {
			runtime.LogInfo(a.ctx, "[APP] Embed plik: "+e.Name())
		}
	}

	// 5. Kopiuj templates/Assets do GameImages
	err = fs.WalkDir(templatesFS, "frontend/templates/Assets", func(path string, d fs.DirEntry, err error) error {
		if err!= nil {
			runtime.LogError(a.ctx, "[APP] WalkDir error: "+err.Error())
			return err
		}
		if d.IsDir() {
			return nil
		}

		data, err := templatesFS.ReadFile(path)
		if err!= nil {
			runtime.LogWarning(a.ctx, "[APP] Nie mogę odczytać template: "+path+" err: "+err.Error())
			return nil
		}

		fileName := filepath.Base(path)
		destPath := filepath.Join(fullPath, "GameImages", fileName)

		if err := os.WriteFile(destPath, data, 0644); err!= nil {
			runtime.LogWarning(a.ctx, "[APP] Nie mogę skopiować: "+destPath+" err: "+err.Error())
		} else {
			runtime.LogInfo(a.ctx, "[APP] Skopiowano template: "+fileName+" -> "+destPath)
		}
		return nil
	})

	if err!= nil {
		runtime.LogWarning(a.ctx, "[APP] Błąd kopiowania templates: "+err.Error())
	}

	runtime.LogInfo(a.ctx, "[APP] Projekt utworzony pomyślnie")
	return nil
}

// ========== OBSŁUGA ASSETÓW ==========

// DIALOG - WYBÓR PLIKU GRAFICZNEGO
func (a *App) SelectImageFile() (string, error) {
	runtime.LogInfo(a.ctx, "[APP] Otwieram dialog wyboru obrazu")
	selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Wybierz grafikę",
		Filters: []runtime.FileFilter{
			{DisplayName: "Obrazy (*.png;*.jpg;*.webp)", Pattern: "*.png;*.jpg;*.jpeg;*.webp"},
		},
	})
	return selection, err
}

// IMPORT ASSETU Z PREFIXEM - TO JEST GŁÓWNA FUNKCJA
func (a *App) ImportAsset(sourcePath, projectPath, assetType string) (string, error) {
	if projectPath == "" {
		projectPath = a.projectPath // fallback na zapisany
	}
	if projectPath == "" {
		return "", fmt.Errorf("brak projectPath - otwórz projekt")
	}

	prefixes := map[string]string{
		"bg": "bg_",
		"re": "re_",
		"av": "av_",
	}
	prefix, ok := prefixes[assetType]
	if!ok {
		err := fmt.Errorf("nieznany typ assetu: %s", assetType)
		runtime.LogError(a.ctx, "[APP] "+err.Error())
		return "", err
	}

	fileName := filepath.Base(sourcePath)
	fileName = strings.ReplaceAll(fileName, " ", "_")
	if!strings.HasPrefix(fileName, prefix) {
		fileName = prefix + fileName
	}

	destDir := filepath.Join(projectPath, "GameImages")
	os.MkdirAll(destDir, 0755) // upewnij się że folder istnieje
	destPath := filepath.Join(destDir, fileName)

	runtime.LogInfo(a.ctx, "[APP] Kopiuję asset: "+sourcePath+" -> "+destPath)

	src, err := os.Open(sourcePath)
	if err!= nil {
		runtime.LogError(a.ctx, "[APP] Błąd otwarcia źródła: "+err.Error())
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(destPath)
	if err!= nil {
		runtime.LogError(a.ctx, "[APP] Błąd tworzenia pliku docelowego: "+err.Error())
		return "", err
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err!= nil {
		runtime.LogError(a.ctx, "[APP] Błąd kopiowania: "+err.Error())
		return "", err
	}

	relPath := "images/" + fileName
	runtime.LogInfo(a.ctx, "[APP] Zaimportowano asset: "+relPath)
	return relPath, nil
}

// HELPER: ImportReactionImage - używa ImportAsset
func (a *App) ImportReactionImage() (string, error) {
	selection, err := a.SelectImageFile()
	if err!= nil {
		return "", err
	}
	if selection == "" {
		return "", nil // user anulował
	}
	return a.ImportAsset(selection, a.projectPath, "re")
}

// LISTA ASSETÓW Z GAMEIMAGES
func (a *App) ListAssets(projectPath string) ([]string, error) {
	if projectPath == "" {
		projectPath = a.projectPath
	}
	dir := filepath.Join(projectPath, "GameImages")
	runtime.LogInfo(a.ctx, "[APP] Listuję assety z: "+dir)

	files, err := os.ReadDir(dir)
	if err!= nil {
		if os.IsNotExist(err) {
			runtime.LogWarning(a.ctx, "[APP] Folder GameImages nie istnieje")
			return []string{}, nil
		}
		runtime.LogError(a.ctx, "[APP] Błąd odczytu GameImages: "+err.Error())
		return nil, err
	}

	var assets []string
	for _, f := range files {
		if!f.IsDir() {
			ext := strings.ToLower(filepath.Ext(f.Name()))
			if ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".webp" {
				assets = append(assets, "images/"+f.Name())
			}
		}
	}
	runtime.LogInfo(a.ctx, fmt.Sprintf("[APP] Znaleziono %d assetów", len(assets)))
	return assets, nil
}

// ZWRACA OBRAZEK JAKO BASE64 DATA URL
func (a *App) GetImageBase64(projectPath, relPath string) (string, error) {
	if projectPath == "" {
		projectPath = a.projectPath
	}
	fileName := strings.TrimPrefix(relPath, "images/")
	fullPath := filepath.Join(projectPath, "GameImages", fileName)

	data, err := os.ReadFile(fullPath)
	if err!= nil {
		runtime.LogError(a.ctx, "[APP] Błąd odczytu obrazka: "+err.Error())
		return "", err
	}

	ext := strings.ToLower(filepath.Ext(fileName))
	mime := "image/jpeg"
	if ext == ".png" {
		mime = "image/png"
	} else if ext == ".webp" {
		mime = "image/webp"
	} else if ext == ".gif" {
		mime = "image/gif"
	}

	b64 := base64.StdEncoding.EncodeToString(data)
	dataUrl := fmt.Sprintf("data:%s;base64,%s", mime, b64)
	runtime.LogDebug(a.ctx, "[APP] Zwracam base64 dla: "+fileName)
	return dataUrl, nil
}

// USUWA ASSET Z PROJEKTU
func (a *App) DeleteAsset(projectPath string, relPath string) error {
	if projectPath == "" {
		projectPath = a.projectPath
	}
	log.Printf("[APP] Usuwanie assetu: %s z %s", relPath, projectPath)

	fileName := strings.TrimPrefix(relPath, "images/")
	fileName = strings.TrimPrefix(fileName, "GameImages/")

	fullPath := filepath.Join(projectPath, "GameImages", fileName)
	cleanPath := filepath.Clean(fullPath)

	gameImagesDir := filepath.Join(projectPath, "GameImages")
	if!strings.HasPrefix(cleanPath, filepath.Clean(gameImagesDir)) {
		return fmt.Errorf("niedozwolona ścieżka: %s", relPath)
	}

	if _, err := os.Stat(cleanPath); os.IsNotExist(err) {
		log.Printf("[APP] Plik nie istnieje: %s", cleanPath)
		return fmt.Errorf("plik nie istnieje: %s", fileName)
	}

	if err := os.Remove(cleanPath); err!= nil {
		log.Printf("[APP] Błąd usuwania %s: %v", cleanPath, err)
		return fmt.Errorf("nie można usunąć pliku: %w", err)
	}

	log.Printf("[APP] Usunięto asset: %s", fileName)
	return nil
}

// DeleteDay usuwa folder dnia z projektu
func (a *App) DeleteDay(projectPath string, dayName string) error {
	if projectPath == "" {
		projectPath = a.projectPath
	}
	log.Printf("[APP] Usuwanie dnia: %s z %s", dayName, projectPath)

	dataDir := filepath.Join(projectPath, "Data")
	dayFile := filepath.Join(dataDir, dayName+".json")

	cleanPath := filepath.Clean(dayFile)

	if!strings.HasPrefix(cleanPath, filepath.Clean(dataDir)) {
		return fmt.Errorf("niedozwolona ścieżka: %s", dayName)
	}

	if _, err := os.Stat(cleanPath); os.IsNotExist(err) {
		return fmt.Errorf("dzień nie istnieje: %s", dayName)
	}

	if err := os.Remove(cleanPath); err!= nil {
		log.Printf("[APP] Błąd usuwania dnia %s: %v", cleanPath, err)
		return fmt.Errorf("nie można usunąć dnia: %w", err)
	}

	log.Printf("[APP] Usunięto dzień: %s", dayName)
	return nil
}

// ODCZYT JSONA
func (a *App) ReadJSON(path string) (string, error) {
	runtime.LogInfo(a.ctx, "[APP] Czytam JSON: "+path)
	data, err := os.ReadFile(path)
	if err!= nil {
		runtime.LogError(a.ctx, "[APP] Błąd odczytu: "+err.Error())
		return "", err
	}
	return string(data), nil
}

// ZAPIS JSONA
func (a *App) WriteJSON(path string, content string) error {
	runtime.LogInfo(a.ctx, "[APP] Zapisuję JSON: "+path)
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err!= nil {
		return err
	}
	return os.WriteFile(path, []byte(content), 0644)
}

// OSTATNIE PROJEKTY
func (a *App) GetRecentProjects() ([]string, error) {
	configDir, err := os.UserConfigDir()
	if err!= nil {
		return []string{}, nil
	}
	configFile := filepath.Join(configDir, "janusz-editor", "recent.json")

	data, err := os.ReadFile(configFile)
	if err!= nil {
		runtime.LogInfo(a.ctx, "[APP] Brak pliku recent.json")
		return []string{}, nil
	}

	var recent []string
	json.Unmarshal(data, &recent)
	runtime.LogInfo(a.ctx, fmt.Sprintf("[APP] Załadowano %d ostatnich projektów", len(recent)))
	return recent, nil
}

func (a *App) AddRecentProject(path string) error {
	recent, _ := a.GetRecentProjects()

	for i, p := range recent {
		if p == path {
			recent = append(recent[:i], recent[i+1:]...)
			break
		}
	}

	recent = append([]string{path}, recent...)

	if len(recent) > 10 {
		recent = recent[:10]
	}

	configDir, _ := os.UserConfigDir()
	configPath := filepath.Join(configDir, "janusz-editor")
	os.MkdirAll(configPath, 0755)

	data, _ := json.MarshalIndent(recent, "", " ")
	configFile := filepath.Join(configPath, "recent.json")
	runtime.LogInfo(a.ctx, "[APP] Zapisuję recent: "+path)
	return os.WriteFile(configFile, data, 0644)
}

// LISTA PLIKÓW W FOLDERZE
func (a *App) ListFiles(folderPath string, extension string) ([]string, error) {
	runtime.LogInfo(a.ctx, "[APP] Skanuję: "+folderPath+" szukam: "+extension)

	files, err := os.ReadDir(folderPath)
	if err!= nil {
		runtime.LogWarning(a.ctx, "[APP] Folder nie istnieje: "+folderPath)
		return []string{}, nil
	}

	var result []string
	for _, file := range files {
		if!file.IsDir() && filepath.Ext(file.Name()) == extension {
			name := file.Name()
			result = append(result, name)
			runtime.LogDebug(a.ctx, "[APP] Znaleziono: "+name)
		}
	}
	runtime.LogInfo(a.ctx, fmt.Sprintf("[APP] Znaleziono %d plików", len(result)))
	return result, nil
}