import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css']
})
export class ContactoComponent implements OnInit {
  contactForm!: FormGroup;
  enviando = false;
  mensajeEnviado = false;
  error = false;
  errorMessage = '';
  
  // ID's de EmailJS
  private readonly serviceId = 'service_oby373b';
  private readonly templateId = 'template_wewwis4';
  private readonly publicKey = 'W_r8w3_A9mA0JPDO_';
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit(): void {
    this.contactForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      mensaje: ['', [Validators.required, Validators.minLength(10)]]
    });
  }
  
  enviarMensaje() {
    if (this.contactForm.invalid) {
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }
    
    this.enviando = true;
    this.error = false;
    this.errorMessage = '';
    this.mensajeEnviado = false;
    
    // Opción 1: Usando emailjs.send con parámetros de la plantilla
    const templateParams = {
      from_name: this.contactForm.value.nombre,
      from_email: this.contactForm.value.email,
      message: this.contactForm.value.mensaje,
      reply_to: this.contactForm.value.email,
      to_email: 'mundonomadabaena@gmail.com'
    };
    
    // Intenta primero con emailjs.send
    emailjs.send(
      this.serviceId,
      this.templateId,
      templateParams, 
      this.publicKey
    )
    .then(
      (response) => {
        console.log('ÉXITO!', response.status, response.text);
        this.enviando = false;
        this.mensajeEnviado = true;
        this.contactForm.reset();
      },
      (err) => {
        // Si falla, intentar con el método alternativo
        console.error('Error con el primer método:', err);
        this.usarMétodoAlternativo();
      }
    );
  }
  
  // Método alternativo usando sendForm
  private usarMétodoAlternativo() {
    const form = document.getElementById('contact-form') as HTMLFormElement;
    
    // Asegurarse de que los campos tengan los nombres correctos
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      const inputElement = input as HTMLInputElement;
      if (inputElement.id === 'nombre') {
        inputElement.name = 'from_name';
      } else if (inputElement.id === 'email') {
        inputElement.name = 'reply_to';
      } else if (inputElement.id === 'mensaje') {
        inputElement.name = 'message';
      }
    });
    
    // Agregar campo oculto para el correo destino
    let hiddenTo = form.querySelector('input[name="to_email"]') as HTMLInputElement;
    if (!hiddenTo) {
      hiddenTo = document.createElement('input');
      hiddenTo.type = 'hidden';
      hiddenTo.name = 'to_email';
      hiddenTo.value = 'mundonomadabaena@gmail.com';
      form.appendChild(hiddenTo);
    }
    
    emailjs.sendForm(
      this.serviceId,
      this.templateId,
      form,
      this.publicKey
    )
    .then(
      (response) => {
        console.log('ÉXITO con método alternativo!', response.status, response.text);
        this.enviando = false;
        this.mensajeEnviado = true;
        this.contactForm.reset();
      },
      (err) => {
        console.error('ERROR FINAL:', err);
        this.errorMessage = 'Error: ' + (err.text || 'Desconocido') + '. Por favor, contacta directamente a mundonomadabaena@gmail.com';
        this.enviando = false;
        this.error = true;
      }
    );
  }
  
  // Utilidades para validación del formulario
  getCampoInvalido(campo: string): boolean {
    const control = this.contactForm.get(campo);
    return control ? control.invalid && control.touched : false;
  }
}
