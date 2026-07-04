package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	runtime.LogInfo(a.ctx, "[APP] Janusz Wails wystartował")
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

// TWORZENIE PROJEKTU
func (a *App) CreateProject(fullPath string, gameName string) error {
	runtime.LogInfo(a.ctx, "[APP] Tworzę projekt: "+fullPath)
	
	// 1. Foldery
	if err := os.MkdirAll(fullPath, 0755); err!= nil {
		runtime.LogError(a.ctx, "[APP] Błąd mkdir: "+err.Error())
		return err
	}
	if err := os.MkdirAll(filepath.Join(fullPath, "Data"), 0755); err!= nil {
		return err
	}
	if err := os.MkdirAll(filepath.Join(fullPath, "Assets", "images"), 0755); err!= nil {
		return err
	}
	if err := os.MkdirAll(filepath.Join(fullPath, "Assets", "sounds"), 0755); err!= nil {
		return err
	}

	// 2. project.janproj
	meta := map[string]interface{}{
		"gameName": gameName,
		"author": "",
		"version": "1.0.0",
		"engineVersion": "1.3.0",
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
			"Background": "",
			"Text": "Budzisz się. To jest początek Twojej gry o Januszu.",
			"Choices": []interface{}{},
		},
	}
	day1Bytes, _ := json.MarshalIndent(day1, "", " ")
	if err := os.WriteFile(filepath.Join(fullPath, "Data", "day1.json"), day1Bytes, 0644); err!= nil {
		return err
	}

	runtime.LogInfo(a.ctx, "[APP] Projekt utworzony pomyślnie")
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
	
	// Wywal duplikat
	for i, p := range recent {
		if p == path {
			recent = append(recent[:i], recent[i+1:]...)
			break
		}
	}
	
	// Dodaj na początek
	recent = append([]string{path}, recent...)
	
	// Max 10
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
			name = name[:len(name)-len(extension)]
			result = append(result, name)
			runtime.LogDebug(a.ctx, "[APP] Znaleziono: "+name)
		}
	}
	runtime.LogInfo(a.ctx, fmt.Sprintf("[APP] Znaleziono %d plików", len(result)))
	return result, nil
}