from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from tethys_sdk.gizmos import Button, RangeSlider, MessageBox

def home(request):
    

    gp_button = Button(
    display_text='Run',
    name='gp_button',
    icon='glyphicon glyphicon-globe',
    attributes={
        'data-toggle':'tooltip',
        'data-placement':'top',
        'title':'Run GeoProcessing Service'
        }
    )

    slider1 = RangeSlider(display_text='Distance around your location (in miles)',
                          name='distance_slider',
                          min=1,
                          max=25,
                          initial=5,
                          step=1
    )

    info_box = MessageBox(name='info_box',
                         title='Message Box Title',
                         message='Click on the map within the SLC county. Select your buffer distance and then click on Run. This service takes about 15s to run.',
                         affirmative_button='Ok',
                         width=400,
                         affirmative_attributes='href=javascript:void(0);')




    return render(request, 'valor_airquality/home.html', {'gp_button':gp_button,'slider1':slider1, 'info_box':info_box})