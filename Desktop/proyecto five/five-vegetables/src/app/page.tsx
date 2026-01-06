import Image from 'next/image'
import Link from 'next/link'
import { Phone, MapPin, Clock, ArrowRight, Leaf, Truck, Shield, Users } from 'lucide-react'
import { HeroCarousel } from '@/components/HeroCarousel'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-8 pb-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Logo */}
            <div className="mb-6">
              <img 
                src="/logo.png" 
                alt="Five Vegetables Logo" 
                className="w-44 sm:w-52 h-auto"
              />
            </div>
            
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
              <span className="text-morph-gray-900">Frutas y Verduras</span>
              <br />
              <span className="text-green-600">Premium</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-morph-gray-600 max-w-lg">
              Venta mayorista con entrega garantizada. Calidad premium, precios personalizados.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-8 py-4 text-lg font-medium text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
              >
                Acceder
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <a
                href="tel:+523319775777"
                className="inline-flex items-center justify-center gap-2 rounded-lg

 border-2 border-green-600 bg-white px-8 py-4 text-lg font-medium text-green-600 transition-all hover:bg-green-50"
              >
                Contáctanos
                <Phone className="h-5 w-5" />
              </a>
            </div>
            
            {/* Stats */}
            <div className="flex gap-8 pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">100%</div>
                <div className="text-sm text-morph-gray-600">Fresco</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">A Tiempo</div>
                <div className="text-sm text-morph-gray-600">Entrega</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">Premium</div>
                <div className="text-sm text-morph-gray-600">Calidad</div>
              </div>
            </div>
          </div>

          {/* Right: Image Carousel */}
          <HeroCarousel />
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-morph-gray-900">
              ¿Por qué elegirnos?
            </h2>
            <p className="mt-4 text-lg text-morph-gray-600">
              Calidad premium para tu negocio
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="rounded-lg bg-gradient-to-br from-green-50 to-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-morph-gray-900">
                Entrega a Tiempo
              </h3>
              <p className="text-morph-gray-600">
                Tu pedido entregado puntualmente con frescura garantizada
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-lg bg-gradient-to-br from-green-50 to-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-morph-gray-900">
                Calidad Premium
              </h3>
              <p className="text-morph-gray-600">
                Productos seleccionados con los más altos estándares de calidad
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-lg bg-gradient-to-br from-green-50 to-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-morph-gray-900">
                Precios a tu Medida
              </h3>
              <p className="text-morph-gray-600">
                Tarifas flexibles adaptadas al volumen de tu negocio
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-lg bg-gradient-to-br from-green-50 to-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600">
                <Leaf className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-morph-gray-900">
                100% Fresco
              </h3>
              <p className="text-morph-gray-600">
                Directo del campo a tu negocio, máxima frescura asegurada
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quiénes Somos Section */}
      <section className="px-4 py-20 bg-gradient-to-br from-green-600 to-green-700">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="text-white space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                Quiénes Somos
              </h2>
              <p className="text-xl text-green-50">
                En <span className="font-bold">Five Vegetables</span>, nos dedicamos a llevar lo mejor del campo directamente a tu negocio.
              </p>
              <p className="text-lg text-green-100">
                Con más de 15 años de experiencia en el sector mayorista, nos hemos convertido en el aliado de confianza para restaurantes, hoteles, y negocios de alimentos en toda la región de Guadalajara.
              </p>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-300 rounded-full mt-2"></div>
                  <p className="text-green-50">
                    <span className="font-bold">Calidad Premium:</span> Seleccionamos cada producto con los más altos estándares de frescura y calidad.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-300 rounded-full mt-2"></div>
                  <p className="text-green-50">
                    <span className="font-bold">Nuestros Clientes Primero:</span> Tu satisfacción es nuestra prioridad. Trabajamos para superar tus expectativas en cada entrega.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-300 rounded-full mt-2"></div>
                  <p className="text-green-50">
                    <span className="font-bold">Compromiso Total:</span> Entrega puntual, trato personalizado y precios justos que apoyan el crecimiento de tu negocio.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src="/quienes-somos.png" 
                  alt="Productos Five Vegetables" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestro Proceso Section */}
      <section className="px-4 py-20 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-morph-gray-900 mb-4">
              Nuestro Proceso
            </h2>
            <p className="text-lg text-morph-gray-600 max-w-2xl mx-auto">
              De la selección a tu negocio, cada paso diseñado para garantizar la máxima calidad
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow-lg" style={{boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)'}}>
                <div className="text-3xl font-bold text-green-600">1</div>
              </div>
              <h3 className="text-xl font-bold text-morph-gray-900">Selección Directa</h3>
              <p className="text-morph-gray-600">
                Trabajamos directamente con productores locales seleccionando solo el mejor producto
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow-lg" style={{boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)'}}>
                <div className="text-3xl font-bold text-green-600">2</div>
              </div>
              <h3 className="text-xl font-bold text-morph-gray-900">Control de Calidad</h3>
              <p className="text-morph-gray-600">
                Cada producto pasa por rigurosos controles para garantizar frescura y calidad premium
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow-lg" style={{boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)'}}>
                <div className="text-3xl font-bold text-green-600">3</div>
              </div>
              <h3 className="text-xl font-bold text-morph-gray-900">Empaque Cuidadoso</h3>
              <p className="text-morph-gray-600">
                Preparamos tu pedido con empaques especializados que preservan la frescura
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow-lg" style={{boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)'}}>
                <div className="text-3xl font-bold text-green-600">4</div>
              </div>
              <h3 className="text-xl font-bold text-morph-gray-900">Entrega Puntual</h3>
              <p className="text-morph-gray-600">
                Tu pedido llega a tiempo y en perfectas condiciones, listo para usar
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios Section */}
      <section className="px-4 py-20 bg-gradient-to-br from-green-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-morph-gray-900 mb-4">
              Lo que Dicen Nuestros Clientes
            </h2>
            <p className="text-lg text-morph-gray-600">
              La confianza de nuestros clientes es nuestro mayor logro
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Testimonio 1 */}
            <div className="bg-white rounded-lg p-8 shadow-md">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-morph-gray-700 mb-4 italic">
                "La calidad de sus productos es excepcional. Desde que trabajamos con Five, nuestros platos han mejorado notablemente. Entrega siempre puntual."
              </p>
              <div className="font-bold text-morph-gray-900">Chef Carlos Martínez</div>
              <div className="text-sm text-morph-gray-600">Restaurante La Toscana</div>
            </div>

            {/* Testimonio 2 */}
            <div className="bg-white rounded-lg p-8 shadow-md">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-morph-gray-700 mb-4 italic">
                "El trato personalizado y los precios competitivos nos han permitido optimizar costos sin sacrificar calidad. Excelente servicio."
              </p>
              <div className="font-bold text-morph-gray-900">Ana Gutiérrez</div>
              <div className="text-sm text-morph-gray-600">Hotel Plaza del Sol</div>
            </div>

            {/* Testimonio 3 */}
            <div className="bg-white rounded-lg p-8 shadow-md">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-morph-gray-700 mb-4 italic">
                "Confianza total en cada pedido. La frescura de sus verduras es incomparable. Son nuestros proveedores desde hace 5 años."
              </p>
              <div className="font-bold text-morph-gray-900">Roberto Sánchez</div>
              <div className="text-sm text-morph-gray-600">Cafetería Del Centro</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="px-4 py-20 bg-gradient-to-r from-green-600 to-green-700">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Regístrate y Prueba Nuestra Plataforma Web
          </h2>
          <p className="text-xl text-green-50 mb-8">
            Haz tus pedidos fácilmente desde cualquier lugar. Dashboard personalizado, catálogo en tiempo real, y control total de tus compras.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-bold text-green-600 shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              Crear Cuenta Ahora
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="tel:+523319775777"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white bg-transparent px-8 py-4 text-lg font-bold text-white transition-all hover:bg-white hover:text-green-600"
            >
              Llamar Ahora
              <Phone className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="px-4 py-16">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Horarios */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-morph-gray-900">Horarios</h3>
              </div>
              <div className="space-y-2 text-morph-gray-700">
                <div className="flex justify-between">
                  <span>Lun - Vie</span>
                  <span>8:00 AM - 4:30 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sábado</span>
                  <span>8:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Domingo</span>
                  <span className="text-red-600">Cerrado</span>
                </div>
              </div>
            </div>

            {/* Teléfono */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-morph-gray-900">Teléfono</h3>
              </div>
              <a
                href="tel:+523319775777"
                className="text-2xl font-bold text-green-600 hover:text-green-700"
              >
                +52 33 1977 5777
              </a>
            </div>

            {/* Ubicación */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-morph-gray-900">Ubicación</h3>
              </div>
              <p className="text-morph-gray-700">
                C. 5 1106, Colón Industrial
                <br />
                44940 Guadalajara, Jal.
              </p>
              <a
                href="https://maps.app.goo.gl/STyKij8cKzDZoCka6"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-green-600 hover:text-green-700"
              >
                Ver en Google Maps
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-morph-gray-900 px-4 py-8 text-white">
        <div className="container mx-auto max-w-7xl text-center">
          <p className="text-morph-gray-400">
            © {new Date().getFullYear()} Five Vegetables. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
